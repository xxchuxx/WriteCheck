const OCR_ENDPOINT =
  process.env.REACT_APP_OCR_ENDPOINT || "http://localhost:8000/upload";

const OCR_TIMEOUT_MS = 90000;

export async function extractTextFromImage(file) {
  const formData = new FormData();
  const controller = new AbortController();
  const timeoutId =
    window.setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);

  formData.append("file", file, file.name);

  let response;

  try {
    response =
      await fetch(OCR_ENDPOINT, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "OCR is taking too long on this machine. Try a smaller/clearer image, or run the FastAPI model on a GPU server."
      );
    }

    throw new Error(
      `Could not reach the OCR server at ${OCR_ENDPOINT}. Start FastAPI with "uvicorn main:app --reload --port 8000", then try again.`
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message =
      "Image text extraction failed.";

    try {
      const data =
        await response.json();

      message =
        data.detail || data.error || message;
    } catch (error) {
      const text =
        await response.text();

      message =
        text || message;
    }

    throw new Error(message);
  }

  const data =
    await response.json();

  return {
    text: data.text || "",
    lines: data.lines ?? [],
  };
}
