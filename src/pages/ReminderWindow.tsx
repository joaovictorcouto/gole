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
}

function formatLiters(ml: number): string {
  return (ml / 1000).toFixed(2).replace(".", ",") + "L";
}

export function ReminderWindow() {
  const [data, setData] = useState<ReminderData | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const unlisten = listen<ReminderData>("reminder", (event) => {
      setData(event.payload);
      setClosing(false);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const closeWindow = async () => {
    setClosing(true);
    // Give the fade-out a moment
    setTimeout(async () => {
      try {
        await getCurrentWindow().hide();
      } catch {}
      setData(null);
      setClosing(false);
    }, 180);
  };

  const handleConfirm = async () => {
    if (!data) return;
    try {
      await api.confirmReminder(data.id, data.suggested_ml);
    } catch (err) {
      console.error(err);
    }
    await closeWindow();
  };

  const handleSnooze = async () => {
    await closeWindow();
    // The Rust backend reschedules naturally because confirm wasn't called;
    // we just dismiss. The next reminder will be sent on the normal cadence.
  };

  if (!data) {
    // Render empty transparent — the window still exists, just nothing visible.
    return <div style={{ width: "100%", height: "100%", background: "transparent" }} />;
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "transparent",
        padding: 8,
        boxSizing: "border-box",
        opacity: closing ? 0 : 1,
        transform: closing ? "translateY(8px)" : "translateY(0)",
        transition: "opacity 180ms ease, transform 180ms ease",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(247,249,252,0.96) 100%)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,0.9)",
          borderLeft: "4px solid #257ca3",
          borderRadius: 16,
          boxShadow: "0 18px 50px rgba(11,32,48,0.28)",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "'Geist', sans-serif",
          color: "#191c1e",
          animation: "slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          boxSizing: "border-box",
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(20px) translateY(10px); }
            to   { opacity: 1; transform: translateX(0) translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7DD8F8 0%, #2A8EC9 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 10px rgba(42,142,201,0.25)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 100 100" fill="none">
              <path d="M50 14C50 14 22 44 22 66C22 81.464 34.536 94 50 94C65.464 94 78 81.464 78 66C78 44 50 14 50 14Z"
                fill="#ffffff" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#191c1e", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }} title={data.phrase}>
              {data.phrase}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 8,
            borderTop: "1px solid rgba(44,52,64,0.08)",
            fontSize: 11,
          }}
        >
          <div>
            <div style={{ color: "#71787c", fontWeight: 600, marginBottom: 2 }}>BEBA</div>
            <div style={{ color: "#257ca3", fontWeight: 700, fontSize: 13 }}>{data.suggested_ml}ml</div>
            {data.container_text && (
              <div style={{ color: "#71787c", fontSize: 9, marginTop: 1 }}>{data.container_text}</div>
            )}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#71787c", fontWeight: 600, marginBottom: 2 }}>JÁ BEBIDO</div>
            <div style={{ color: "#0f76a0", fontWeight: 700, fontSize: 13 }}>{formatLiters(data.consumed_ml)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#71787c", fontWeight: 600, marginBottom: 2 }}>FALTA</div>
            <div style={{ color: "#e28743", fontWeight: 700, fontSize: 13 }}>{formatLiters(data.remaining_ml)}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)",
              boxShadow: "0 4px 10px rgba(59,99,119,0.25)",
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
              border: "1px solid #c1c7cc",
              color: "#5B6572",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              background: "rgba(255,255,255,0.6)",
            }}
          >
            Daqui 5 min
          </button>
        </div>
      </div>
    </div>
  );
}
