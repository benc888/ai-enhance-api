export default async function handler(req, res) {
  const { imageUrl } = req.body;

  const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "7c176eaa-37c7-4c93-9152-13bf27c3f013",  // ✅ Real-ESRGAN 最新版本 ID
      input: { image: imageUrl },
    }),
  });

  const data = await replicateRes.json();

  if (data?.urls?.get) {
    const getUrl = data.urls.get;
    let outputUrl = null;

    while (!outputUrl) {
      const result = await fetch(getUrl, {
        headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
      });
      const resultData = await result.json();

      if (resultData.status === "succeeded") {
        outputUrl = resultData.output;
        break;
      } else if (resultData.status === "failed") {
        return res.status(500).json({ error: "AI processing failed." });
      }

      await new Promise((r) => setTimeout(r, 1500));
    }

    return res.status(200).json({ output: outputUrl });
  }

  return res.status(500).json({ error: "Replicate call failed." });
}
