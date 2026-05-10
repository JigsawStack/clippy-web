import ClippyWeb from "./index";

const envApiKey = (import.meta.env.VITE_INTERFAZE_API_KEY as string | undefined)?.trim() ?? "";

const status = document.querySelector<HTMLElement>("#demo-status");

function setStatus(text: string): void {
  if (status) status.textContent = text;
}

if (!envApiKey) {
  setStatus("Missing VITE_INTERFAZE_API_KEY in .env");
} else {
  ClippyWeb(envApiKey, {
    debug: true,
    onTranscript: (transcript) => {
      setStatus(`Transcribed: ${transcript}`);
    },
    onError: (error) => {
      setStatus(`Error: ${error.message}`);
    },
  });

  setStatus("Clippy started from .env. Hold Option + X, speak, then release.");
}
