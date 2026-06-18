import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { api } from "../lib/api";

interface ReminderData {
  id: number;
  phrase: string;
  suggested_ml: number;
  consumed_ml: number;
  remaining_ml: number;
  container_text?: string | null;
  suggested_sips?: number;
  sip_ml?: number;
  is_test?: boolean;
  app_mode?: string;
}

export function ReminderWindow() {
  const [data, setData] = useState<ReminderData | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const unlisten = listen<ReminderData>("reminder", (event) => {
      setData(event.payload);
      setClosing(false);
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  const closeWindow = async () => {
    setClosing(true);
    setTimeout(async () => {
      try { await getCurrentWindow().hide(); } catch {}
      setData(null);
      setClosing(false);
    }, 200);
  };

  const handleConfirm = async () => {
    if (!data) return;
    try { await api.confirmReminder(data.id, data.suggested_ml); } catch (err) { console.error(err); }
    await closeWindow();
  };

  const handleSnooze = async () => {
    if (data) { try { await api.snoozeReminder(data.id, 5); } catch (err) { console.error(err); } }
    await closeWindow();
  };

  const handleDismissTest = async () => {
    await closeWindow();
  };

  if (!data) {
    return <div style={{ width: "100%", height: "100%", background: "transparent" }} />;
  }

  const sips = data.suggested_sips ?? Math.ceil(data.suggested_ml / (data.sip_ml || 20));

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "transparent",
        padding: "16px 10px 10px 10px",
        boxSizing: "border-box",
        opacity: closing ? 0 : 1,
        transform: closing ? "translateY(8px) scale(0.97)" : "translateY(0) scale(1)",
        transition: "opacity 200ms ease, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        fontFamily: "'Geist', sans-serif",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes cardIn {
          0%   { opacity: 0; transform: translateY(-14px) scale(0.94); }
          70%  { opacity: 1; transform: translateY(2px) scale(1.02); }
          100% { transform: translateY(0) scale(1); }
        }
        .card-anim { animation: cardIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>

      {/* Test-mode controls floating ABOVE the card */}
      {data.is_test && (
        <>
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 60,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "#bf360c",
              background: "rgba(255,224,178,0.95)",
              padding: "2px 8px",
              borderRadius: 6,
              zIndex: 3,
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            TESTE
          </span>
          <button
            onClick={handleDismissTest}
            title="Fechar (modo teste)"
            style={{
              position: "absolute",
              top: 0,
              right: 6,
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "none",
              background: "rgba(25,28,30,0.85)",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              lineHeight: 1,
              zIndex: 3,
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          >
            ×
          </button>
        </>
      )}

      {/* Decorative droplet attached to the top-left corner */}
      <svg
        width="30" height="40" viewBox="0 0 42 56" fill="none"
        style={{
          position: "absolute",
          top: 0,
          left: 20,
          zIndex: 5,
          filter: "drop-shadow(0 6px 10px rgba(15,76,110,0.22))",
        }}
        className="card-anim"
      >
        <defs>
          <linearGradient id="tail-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8AD4FF" />
            <stop offset="100%" stopColor="#257ca3" />
          </linearGradient>
        </defs>
        <path
          d="M21 3 C 12 18, 4 30, 4 36 A 17 17 0 0 0 38 36 C 38 30, 30 18, 21 3 Z"
          fill="url(#tail-grad)"
        />
        <path d="M14 22 C 10 30, 9 36, 11 40" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>

      <div
        className="card-anim"
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(247,251,253,0.97) 100%)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(37,124,163,0.18)",
          borderLeft: "4px solid #257ca3",
          borderRadius: 16,
          boxShadow: "0 16px 40px rgba(15,76,110,0.28)",
          padding: "12px 14px 14px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          color: "#191c1e",
          boxSizing: "border-box",
          position: "relative",
          marginTop: 0,
        }}
      >
        {/* Phrase */}
        {data.app_mode === "basic" ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 10px",
              marginTop: 10,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#191c1e",
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
              title={data.phrase}
            >
              {data.phrase}
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#191c1e",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: 32,
              paddingLeft: 34,
            }}
            title={data.phrase}
          >
            {data.phrase}
          </div>
        )}

        {/* Highlighted amount */}
        {data.app_mode !== "basic" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(138,212,255,0.25) 0%, rgba(37,124,163,0.16) 100%)",
              border: "1px solid rgba(37,124,163,0.28)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#0f76a0", letterSpacing: 0.6, textTransform: "uppercase" }}>
                Beba agora
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 3 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#0f4c6e", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {sips}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0f76a0" }}>
                  {sips === 1 ? "gole" : "goles"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.1 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#0f4c6e" }}>{data.suggested_ml}ml</span>
              <span style={{ fontSize: 9, color: "#71787c", marginTop: 3 }}>
                {(data.consumed_ml / 1000).toFixed(2).replace(".", ",")}L de {((data.consumed_ml + data.remaining_ml) / 1000).toFixed(2).replace(".", ",")}L
              </span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)",
              boxShadow: "0 4px 10px rgba(37,124,163,0.32)",
            }}
          >
            Já bebi ✓
          </button>
          <button
            onClick={handleSnooze}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(193,199,204,0.8)",
              color: "#5B6572",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              background: "rgba(255,255,255,0.7)",
            }}
          >
            +5min
          </button>
        </div>
      </div>
    </div>
  );
}
