import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { catalog } from "./catalog";
import { CREDENTIALS_CATALOG, type CredentialItem } from "./credentials";
import { ShelfEngine, type ShelfMode } from "./ShelfEngine";
import "./complete-shelf.css";

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <span aria-hidden="true" className={`arrow-icon arrow-icon--${direction}`}>
      <span />
    </span>
  );
}

export function ProgressLibrary({ onBackToPortfolio }: { onBackToPortfolio?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ShelfEngine | null>(null);
  const certDialogRef = useRef<HTMLDialogElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<ShelfMode>("browse");
  const [ready, setReady] = useState(false);
  const [_status, setStatus] = useState("Preparing the complete catalog");
  const [navTool, setNavTool] = useState<"pan" | "orbit">("pan");
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [selectedCert, setSelectedCert] = useState<CredentialItem | null>(null);
  const [hoveredCert, setHoveredCert] = useState<CredentialItem | null>(null);

  const activeBook = catalog[activeIndex];
  const selectedBook = useMemo(
    () => (selectedIndex === null ? null : catalog[selectedIndex]),
    [selectedIndex],
  );
  const isFocused = mode === "focusing" || mode === "inspect";

  const activeCertIndex = useMemo(
    () => (selectedCert ? CREDENTIALS_CATALOG.findIndex((c) => c.id === selectedCert.id) : -1),
    [selectedCert],
  );

  useEffect(() => {
    const dialog = certDialogRef.current;
    if (!dialog || !selectedCert) return;
    if (!dialog.open) {
      dialog.returnValue = "";
      dialog.showModal();
    }
  }, [selectedCert]);

  // Safari fallback for declarative closedby="any" light-dismiss
  useEffect(() => {
    const dialog = certDialogRef.current;
    if (!dialog || typeof HTMLDialogElement === "undefined") return;
    if ("closedBy" in HTMLDialogElement.prototype) return;

    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };

    let pressedOutside = false;
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let engine: ShelfEngine | null = null;

    async function start() {
      if (!canvasRef.current) return;
      await document.fonts.ready;
      if (cancelled || !canvasRef.current) return;

      engine = new ShelfEngine(canvasRef.current, catalog, {
        onActiveIndex: setActiveIndex,
        onMode: (nextMode, index) => {
          setMode(nextMode);
          setSelectedIndex(index);
          if (nextMode === "browse") {
            setIsDrawerOpen(true);
          }
        },
        onStatus: setStatus,
        onReady: () => setReady(true),
        onNavToolChange: setNavTool,
        onSelectCertificate: (cert) => {
          setSelectedCert(cert);
        },
        onHoverCertificate: (cert) => {
          setHoveredCert(cert);
        },
      });
      engineRef.current = engine;
    }

    void start();
    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  const handlePrev = () => {
    if (engineRef.current && activeIndex > 0) {
      engineRef.current.browseTo(activeIndex - 1);
    }
  };

  const handleNext = () => {
    if (engineRef.current && activeIndex < catalog.length - 1) {
      engineRef.current.browseTo(activeIndex + 1);
    }
  };

  const handleInspect = () => {
    if (engineRef.current) {
      engineRef.current.focusBook(activeIndex);
    }
  };

  const handleReturn = () => {
    if (engineRef.current) {
      engineRef.current.returnToShelf();
    }
  };

  const handleSetNavTool = (tool: "pan" | "orbit") => {
    setNavTool(tool);
    engineRef.current?.setNavTool(tool);
  };

  const handleZoomIn = () => {
    engineRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    engineRef.current?.zoomOut();
  };

  const handleResetView = () => {
    engineRef.current?.resetView();
  };

  const handleToggleDrawer = () => {
    setIsDrawerOpen((prev) => {
      const next = !prev;
      engineRef.current?.setDrawerOpen(next);
      return next;
    });
  };

  useEffect(() => {
    if (!isFocused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "m" || e.key === "M") {
        setNavTool((prev) => {
          const next = prev === "pan" ? "orbit" : "pan";
          engineRef.current?.setNavTool(next);
          return next;
        });
      } else if (e.key === "r" || e.key === "R") {
        engineRef.current?.resetView();
      } else if (e.key === "+" || e.key === "=") {
        engineRef.current?.zoomIn();
      } else if (e.key === "-" || e.key === "_") {
        engineRef.current?.zoomOut();
      } else if (e.key === "d" || e.key === "D") {
        setIsDrawerOpen((prev) => {
          const next = !prev;
          engineRef.current?.setDrawerOpen(next);
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFocused]);

  return (
    <main
      className={`press-experience ${ready ? "is-ready" : ""} ${
        isFocused ? "is-focused" : "is-browsing"
      }`}
    >
      <canvas
        ref={canvasRef}
        className="shelf-canvas"
        data-testid="shelf-canvas"
        role="application"
        tabIndex={0}
        aria-label={`Interactive three-dimensional shelf of ${catalog.length} books. Drag or use the arrow keys to browse. Press Enter to inspect the selected book.`}
      />

      {/* Header Bar */}
      <header className="site-header">
        <div className="wordmark" aria-label="Kirren Fraginal Portfolio">
          <span className="wordmark__dot" aria-hidden="true" />
          <span>KIRREN FRAGINAL</span>
          <span className="wordmark__divider" />
          <span>PROJECT LIBRARY</span>
        </div>

        {/* Interactive Wall Credentials Dock */}
        <div className="header-credentials" role="group" aria-label="Verified certificates on gallery wall">
          <span className="header-credentials__label">[ CREDENTIALS ]</span>
          <div className="header-credentials__pills">
            {CREDENTIALS_CATALOG.map((cert, idx) => {
              const isHighlighted = hoveredCert?.id === cert.id;
              return (
                <button
                  key={cert.id}
                  type="button"
                  className={`credential-chip ${isHighlighted ? "is-highlighted" : ""}`}
                  style={{ "--cert-accent": cert.accentHex } as CSSProperties}
                  onMouseEnter={() => engineRef.current?.setHighlightedCertificate(cert.id)}
                  onMouseLeave={() => engineRef.current?.setHighlightedCertificate(null)}
                  onFocus={() => engineRef.current?.setHighlightedCertificate(cert.id)}
                  onBlur={() => engineRef.current?.setHighlightedCertificate(null)}
                  onClick={() => setSelectedCert(cert)}
                >
                  <span className="credential-chip__index">0{idx + 1}</span>
                  <span>{cert.shortTitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="header-actions">
          {onBackToPortfolio && (
            <button
              type="button"
              onClick={onBackToPortfolio}
              className="exit-archive-btn"
            >
              ← EXIT ARCHIVE
            </button>
          )}
          <div className="edition-mark">
            <span>{catalog.length} VOLUMES · {CREDENTIALS_CATALOG.length} CERTS</span>
            <span>2024–2026 ARCHIVE</span>
          </div>
        </div>
      </header>

      {/* Browse Caption Overlay */}
      {activeBook && (
        <section className="browse-caption" aria-live="polite">
          <div className="eyebrow">
            <span className="eyebrow__line" />
            <span>[ VOLUME {String(activeIndex + 1).padStart(2, "0")} OF {String(catalog.length).padStart(2, "0")} ]</span>
          </div>
          <h1>{activeBook.title}</h1>
          <p className="browse-caption__author">{activeBook.author}</p>

          <div className="browse-caption__actions">
            <button
              type="button"
              className="inspect-button"
              onClick={handleInspect}
            >
              INSPECT VOLUME →
            </button>
          </div>

          <p className="browse-caption__hint">
            {hoveredCert
              ? `Inspecting: ${hoveredCert.issuer} — Click frame to open`
              : "Click volume to read · Click framed certs above"}
          </p>
        </section>
      )}

      {/* Detail Drawer Side Overlay */}
      {selectedBook && (
        <aside
          className={`detail-drawer ${!isDrawerOpen ? "is-collapsed" : ""}`}
          aria-label="Book details"
        >
          <div className="detail-drawer__header-actions">
            <button
              type="button"
              className="detail-drawer__close"
              onClick={handleReturn}
            >
              ← RETURN TO SHELF
            </button>

            <button
              type="button"
              className="detail-drawer__collapse-btn"
              onClick={handleToggleDrawer}
              title="Collapse details panel to widen book view"
              aria-label="Collapse details panel"
            >
              HIDE ◨
            </button>
          </div>

          <h2 className="detail-drawer__title">{selectedBook.title}</h2>
          <p className="detail-drawer__author">{selectedBook.author}</p>

          <p className="detail-drawer__description">{selectedBook.description}</p>

          {selectedBook.quote && (
            <blockquote className="detail-drawer__quote">
              “{selectedBook.quote}”
              <cite style={{ display: "block", marginTop: "8px", fontSize: "12px", fontStyle: "normal", opacity: 0.7 }}>
                — {selectedBook.quoteBy}
              </cite>
            </blockquote>
          )}

          <div className="detail-drawer__meta">
            <div><strong>FORMAT:</strong> {selectedBook.format}</div>
            <div><strong>AVAILABILITY:</strong> {selectedBook.availability}</div>
          </div>

          {selectedBook.url && (
            <a
              href={selectedBook.url}
              target="_blank"
              rel="noreferrer"
              className="detail-drawer__link"
            >
              {selectedBook.linkLabel || "VIEW PROJECT"} →
            </a>
          )}
        </aside>
      )}

      {/* 3D Viewport Navigation Toolbar (Move / Pan / Orbit / Zoom / Reset) */}
      {isFocused && (
        <>
          <div
            className="viewport-nav-bar"
            role="toolbar"
            aria-label="Book navigation and 3D camera controls"
          >
            <div className="nav-tool-group">
              <button
                type="button"
                className={`nav-tool-btn ${navTool === "pan" ? "is-active" : ""}`}
                onClick={() => handleSetNavTool("pan")}
                title="Move / Pan View (Click and drag to move camera across pages)"
                aria-pressed={navTool === "pan"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
                </svg>
                <span>MOVE VIEW</span>
              </button>

              <button
                type="button"
                className={`nav-tool-btn ${navTool === "orbit" ? "is-active" : ""}`}
                onClick={() => handleSetNavTool("orbit")}
                title="Orbit / Rotate (Click and drag to view book in 3D perspective)"
                aria-pressed={navTool === "orbit"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24" />
                  <path d="M21 3v6h-6" />
                </svg>
                <span>ORBIT 3D</span>
              </button>
            </div>

            <div className="nav-divider" />

            <div className="nav-zoom-group">
              <button
                type="button"
                className="nav-action-btn"
                onClick={handleZoomIn}
                title="Zoom In (+)"
                aria-label="Zoom In"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </button>

              <button
                type="button"
                className="nav-action-btn"
                onClick={handleZoomOut}
                title="Zoom Out (-)"
                aria-label="Zoom Out"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </button>
            </div>

            <div className="nav-divider" />

            <button
              type="button"
              className="nav-action-btn nav-action-btn--reset"
              onClick={handleResetView}
              title="Reset View to Default Framing"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>RESET</span>
            </button>

            <div className="nav-divider" />

            <button
              type="button"
              className={`nav-action-btn nav-action-btn--drawer ${!isDrawerOpen ? "is-collapsed" : ""}`}
              onClick={handleToggleDrawer}
              title={isDrawerOpen ? "Collapse details panel to widen book view" : "Expand book details panel"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
              <span>{isDrawerOpen ? "HIDE DETAILS" : "SHOW DETAILS"}</span>
            </button>
          </div>

          <div className="viewport-nav-hint">
            {navTool === "pan"
              ? "Drag to move camera · Right-click to rotate · Scroll to zoom · [R] Reset · [M] Orbit Mode · [D] Details"
              : "Drag to rotate in 3D · Right-click to move · Scroll to zoom · [R] Reset · [M] Move Mode · [D] Details"}
          </div>
        </>
      )}

      {/* Navigation Controls Bar */}
      <nav
        className="shelf-controls"
        aria-label="Shelf navigation"
        aria-hidden={isFocused}
      >
        <button
          type="button"
          className="shelf-control-btn"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Previous volume"
          tabIndex={isFocused ? -1 : 0}
        >
          <ArrowIcon direction="left" />
        </button>

        <div className="shelf-pagination" role="tablist" aria-label="Volumes">
          {catalog.map((book, idx) => (
            <button
              key={book.id}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Go to ${book.shortTitle || book.title}`}
              className={`shelf-pagination-pill ${idx === activeIndex ? "is-active" : ""}`}
              tabIndex={isFocused ? -1 : 0}
              onClick={() => {
                if (engineRef.current) engineRef.current.browseTo(idx);
              }}
            >
              <span className="pagination-num">{String(idx + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="shelf-control-btn"
          onClick={handleNext}
          disabled={activeIndex === catalog.length - 1}
          aria-label="Next volume"
          tabIndex={isFocused ? -1 : 0}
        >
          <ArrowIcon direction="right" />
        </button>
      </nav>

      {/* Native Accessible Certificate Lightbox Dialog */}
      <dialog
        ref={certDialogRef}
        {...({ closedby: "any" } as Record<string, string>)}
        aria-labelledby="cert-dialog-title"
        className="cert-dialog"
        onClose={() => {
          if (certDialogRef.current) {
            certDialogRef.current.returnValue = "";
          }
          setSelectedCert(null);
        }}
      >
        {selectedCert && (
          <div className="cert-dialog__frame">
            <header className="cert-dialog__topbar">
              <div className="cert-dialog__code-group">
                <span
                  className="cert-dialog__dot"
                  style={{ backgroundColor: selectedCert.accentHex }}
                  aria-hidden="true"
                />
                <span className="cert-dialog__code">
                  [ {selectedCert.code} // {selectedCert.issuer.toUpperCase()} ]
                </span>
              </div>

              <div className="cert-dialog__actions">
                <div className="cert-dialog__switcher" role="group" aria-label="Switch certificate">
                  <button
                    type="button"
                    className="cert-dialog__nav-btn"
                    onClick={() => {
                      const prevIdx = (activeCertIndex - 1 + CREDENTIALS_CATALOG.length) % CREDENTIALS_CATALOG.length;
                      setSelectedCert(CREDENTIALS_CATALOG[prevIdx]);
                    }}
                    aria-label="Previous certificate"
                  >
                    ←
                  </button>
                  <span className="cert-dialog__counter">
                    0{activeCertIndex + 1} / 0{CREDENTIALS_CATALOG.length}
                  </span>
                  <button
                    type="button"
                    className="cert-dialog__nav-btn"
                    onClick={() => {
                      const nextIdx = (activeCertIndex + 1) % CREDENTIALS_CATALOG.length;
                      setSelectedCert(CREDENTIALS_CATALOG[nextIdx]);
                    }}
                    aria-label="Next certificate"
                  >
                    →
                  </button>
                </div>

                <button
                  type="button"
                  autoFocus
                  className="cert-dialog__close"
                  onClick={() => certDialogRef.current?.close()}
                >
                  CLOSE <span aria-hidden="true">×</span>
                </button>
              </div>
            </header>

            <div className="cert-dialog__body">
              <div className="cert-dialog__mat">
                <div
                  className="cert-dialog__fillet"
                  style={{ borderColor: selectedCert.accentHex }}
                >
                  <img
                    src={selectedCert.image}
                    alt={`${selectedCert.title} issued by ${selectedCert.issuer}`}
                    className="cert-dialog__img"
                  />
                </div>
              </div>

              <div className="cert-dialog__details">
                <p className="cert-dialog__category">{selectedCert.category}</p>
                <h2 id="cert-dialog-title" className="cert-dialog__title">
                  {selectedCert.title}
                </h2>
                <p className="cert-dialog__issuer">
                  Issued by <strong>{selectedCert.issuer}</strong>
                </p>

                <p className="cert-dialog__desc">{selectedCert.description}</p>

                <ul className="cert-dialog__highlights" aria-label="Key verified competencies">
                  {selectedCert.highlights.map((item) => (
                    <li key={item} className="cert-dialog__tag">
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="cert-dialog__footer">
                  <a
                    href={selectedCert.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cert-dialog__original-link"
                  >
                    OPEN FULL RESOLUTION ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </main>
  );
}
