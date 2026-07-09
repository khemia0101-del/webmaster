"use client";

export default function GlobalError() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, Helvetica, sans-serif", background: "#f4eadb", color: "#101827" }}>
        <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: 24 }}>
          <div style={{ maxWidth: 640 }}>
            <p style={{ color: "#b86a32", fontWeight: 700, textTransform: "uppercase" }}>Service unavailable</p>
            <h1 style={{ fontSize: 42, margin: "12px 0" }}>Conquistador Oil could not load.</h1>
            <p style={{ color: "#5c6570", lineHeight: 1.6 }}>Please refresh the page or try again shortly.</p>
          </div>
        </main>
      </body>
    </html>
  );
}
