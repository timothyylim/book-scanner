import { BarcodeScanner } from "./scanner";
import { isISBN, isbn13to10, formatISBN13 } from "./isbn";
import { lookupBook } from "./openlibrary";
import { getHistory, addScan, clearHistory } from "./storage";
import type { ScanRecord } from "./types";
import "./style.css";

// DOM elements
const scannerSection = document.getElementById("scanner-section")!;
const resultSection = document.getElementById("result-section")!;
const historySection = document.getElementById("history-section")!;
const video = document.getElementById("video") as HTMLVideoElement;
const scanBtn = document.getElementById("scan-btn")!;
const scannerStatus = document.getElementById("scanner-status")!;
const scanAgainBtn = document.getElementById("scan-again-btn")!;
const copyBtn = document.getElementById("copy-btn")!;
const clearHistoryBtn = document.getElementById("clear-history-btn")!;
const historyList = document.getElementById("history-list")!;

// Result elements
const resultCover = document.getElementById("result-cover") as HTMLImageElement;
const resultTitle = document.getElementById("result-title")!;
const resultAuthor = document.getElementById("result-author")!;
const resultISBN13 = document.getElementById("result-isbn13")!;
const resultISBN10 = document.getElementById("result-isbn10")!;
const resultPages = document.getElementById("result-pages")!;
const resultPagesRow = document.getElementById("result-pages-row")!;
const resultPublished = document.getElementById("result-published")!;
const resultPublishedRow = document.getElementById("result-published-row")!;
const resultLoading = document.getElementById("result-loading")!;
const resultNotFound = document.getElementById("result-not-found")!;
const openlibLink = document.getElementById("openlib-link") as HTMLAnchorElement;

const scanner = new BarcodeScanner(video);

// State
let currentISBN13 = "";

function showView(view: "scanner" | "result") {
  scannerSection.classList.toggle("hidden", view !== "scanner");
  resultSection.classList.toggle("hidden", view !== "result");
  historySection.classList.toggle("hidden", view !== "scanner");
}

async function startScanning() {
  try {
    scanBtn.textContent = "Stop Scanning";
    scannerStatus.textContent = "Point camera at a book barcode";
    scannerStatus.className = "scanner-status";
    await scanner.start(onBarcodeDetected);
  } catch (err) {
    scannerStatus.textContent =
      err instanceof DOMException && err.name === "NotAllowedError"
        ? "Camera permission denied. Please allow camera access."
        : "Could not access camera.";
    scannerStatus.className = "scanner-status error";
    scanBtn.textContent = "Start Scanning";
  }
}

function stopScanning() {
  scanner.stop();
  scanBtn.textContent = "Start Scanning";
  scannerStatus.textContent = "";
}

async function onBarcodeDetected(rawValue: string) {
  // Vibrate on success if supported
  if (navigator.vibrate) navigator.vibrate(100);

  stopScanning();

  if (!isISBN(rawValue)) {
    scannerStatus.textContent = `Not a book barcode: ${rawValue}`;
    scannerStatus.className = "scanner-status error";
    return;
  }

  currentISBN13 = rawValue;
  const isbn10 = isbn13to10(rawValue);

  // Show result view immediately with ISBN
  resultISBN13.textContent = formatISBN13(rawValue);
  resultISBN10.textContent = isbn10 ?? "N/A";
  resultTitle.textContent = "";
  resultAuthor.textContent = "";
  resultCover.src = "";
  resultCover.classList.add("hidden");
  resultPagesRow.classList.add("hidden");
  resultPublishedRow.classList.add("hidden");
  resultNotFound.classList.add("hidden");
  resultLoading.classList.remove("hidden");
  openlibLink.href = `https://openlibrary.org/isbn/${rawValue}`;
  showView("result");

  // Build scan record
  const record: ScanRecord = {
    id: crypto.randomUUID(),
    isbn13: rawValue,
    isbn10,
    scannedAt: new Date().toISOString(),
  };

  // Look up metadata
  try {
    const metadata = await lookupBook(rawValue);
    resultLoading.classList.add("hidden");

    if (metadata) {
      record.metadata = metadata;
      resultTitle.textContent = metadata.title;
      resultAuthor.textContent = metadata.authors.join(", ");
      resultCover.src = metadata.coverUrl;
      resultCover.alt = metadata.title;
      resultCover.classList.remove("hidden");

      if (metadata.pageCount) {
        resultPages.textContent = String(metadata.pageCount);
        resultPagesRow.classList.remove("hidden");
      }
      if (metadata.publishDate) {
        resultPublished.textContent = metadata.publishDate;
        resultPublishedRow.classList.remove("hidden");
      }
      if (metadata.openLibraryKey) {
        openlibLink.href = `https://openlibrary.org${metadata.openLibraryKey}`;
      }
    } else {
      resultNotFound.classList.remove("hidden");
    }
  } catch {
    resultLoading.classList.add("hidden");
    resultNotFound.classList.remove("hidden");
    resultNotFound.textContent = "Offline — metadata unavailable";
  }

  // Save to history
  await addScan(record);
  await renderHistory();
}

async function renderHistory() {
  const records = await getHistory();

  if (records.length === 0) {
    historyList.innerHTML =
      '<p class="empty-state">No scans yet. Tap "Start Scanning" to begin.</p>';
    clearHistoryBtn.classList.add("hidden");
    return;
  }

  clearHistoryBtn.classList.remove("hidden");
  historyList.innerHTML = records
    .map((r) => {
      const title = r.metadata?.title ?? formatISBN13(r.isbn13);
      const author = r.metadata?.authors?.join(", ") ?? "";
      const time = new Date(r.scannedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const coverSrc = r.metadata
        ? `https://covers.openlibrary.org/b/isbn/${r.isbn13}-S.jpg`
        : "";

      return `
        <div class="history-item">
          ${coverSrc ? `<img class="history-cover" src="${coverSrc}" alt="" />` : '<div class="history-cover-placeholder"></div>'}
          <div class="history-info">
            <span class="history-title">${escapeHtml(title)}</span>
            ${author ? `<span class="history-author">${escapeHtml(author)}</span>` : ""}
          </div>
          <span class="history-time">${time}</span>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Event listeners
scanBtn.addEventListener("click", () => {
  if (scanner.isScanning()) {
    stopScanning();
  } else {
    startScanning();
  }
});

scanAgainBtn.addEventListener("click", () => {
  showView("scanner");
  startScanning();
});

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(currentISBN13);
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy ISBN"), 1500);
});

clearHistoryBtn.addEventListener("click", async () => {
  await clearHistory();
  await renderHistory();
});

// Cover image error handling — hide if fails to load
resultCover.addEventListener("error", () => {
  resultCover.classList.add("hidden");
});

// Init
renderHistory();
