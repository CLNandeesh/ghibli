import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const examples = [
  {
    title: "Sunset stroll",
    scene: "Two friends walking through a flower-filled meadow at sunset, smiling and talking.",
    names: "Apu and Ramya",
    details: "Apu: young man with short black hair, blue shirt. Ramya: young woman with long dark hair, pink saree."
  },
  {
    title: "Mountain adventure",
    scene: "A young explorer standing beside a tiny friendly forest spirit on a mountain path.",
    names: "Meera",
    details: "Meera: young woman with a short bob haircut, yellow raincoat, and a small backpack."
  },
  {
    title: "Rainy day",
    scene: "A family waiting at a countryside bus stop under one colourful umbrella while little birds gather nearby.",
    names: "A family of three",
    details: "A parent in a green jacket, another parent in a cream sweater, and a child in red overalls."
  }
];

function App() {
  const [characterCount, setCharacterCount] = useState("2");
  const [characterDetails, setCharacterDetails] = useState("");
  const [scene, setScene] = useState("");
  const [background, setBackground] = useState("A lush Japanese countryside with flowers, rolling hills and a distant village");
  const [referenceImage, setReferenceImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const referenceName = useMemo(() => referenceImage?.name || "", [referenceImage]);

  function applyExample(example) {
    setScene(example.scene);
    setCharacterDetails(`${example.names}: ${example.details}`);
    setCharacterCount(example.names.includes("family") ? "3" : "2");
    setError("");
  }

  function handleImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Please choose a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Please choose an image smaller than 10 MB.");
      return;
    }
    setReferenceImage(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  async function generateImage(event) {
    event.preventDefault();
    if (!characterDetails.trim()) {
      setError("Add the character names and a short appearance description.");
      return;
    }
    if (!scene.trim()) {
      setError("Add a short scene description first.");
      return;
    }
    setBusy(true);
    setError("");
    setGeneratedImage("");

    const form = new FormData();
    form.append("characterCount", characterCount);
    form.append("characterDetails", characterDetails);
    form.append("scene", scene);
    form.append("background", background);
    form.append("orientation", "portrait");
    if (referenceImage) form.append("referenceImage", referenceImage);

    try {
      const response = await fetch("/api/generate", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not generate the image.");
      setGeneratedImage(data.image);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function downloadImage() {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = "ghibli-studio-creation.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Ghibli Studio home">
          <span className="brand-mark">✿</span>
          <span>Ghibli <b>Studio</b></span>
          <span className="brand-ai">AI</span>
        </a>
        <div className="top-note"><span className="status-dot" /> A little magic, made from your imagination</div>
      </header>

      <section className="intro">
        <div className="eyebrow">YOUR IMAGINATION, ILLUSTRATED</div>
        <h1>Turn your moments into <em>animated magic.</em></h1>
        <p>Just four simple details, plus an optional photo. We'll create the whimsical, hand-painted illustration.</p>
      </section>

      <section className="workspace">
        <form className="panel input-panel" onSubmit={generateImage}>
          <div className="panel-heading">
            <div><span className="step">01</span><h2>Build your scene</h2></div>
            <span className="optional">Your story</span>
          </div>

          <label className="field-label" htmlFor="characterCount">Number of characters</label>
          <select id="characterCount" value={characterCount} onChange={e => setCharacterCount(e.target.value)}>
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? "character" : "characters"}</option>)}
          </select>

          <label className="field-label" htmlFor="characterDetails">Character names and appearance <b className="required">*</b></label>
          <textarea id="characterDetails" rows="3" value={characterDetails} onChange={e => setCharacterDetails(e.target.value)} placeholder="Example: Apu is a young man with short black hair wearing a blue shirt. Ramya has long dark hair and wears a pink saree." required />

          <label className="field-label" htmlFor="scene">What should happen? <b className="required">*</b></label>
          <textarea id="scene" rows="4" maxLength="900" value={scene} onChange={e => setScene(e.target.value)} placeholder="Example: Two friends walking together through a magical flower garden at sunset..." required />
          <div className="char-count">{scene.length}/900</div>

          <div className="examples">
            <div className="mini-heading">TRY A SCENE</div>
            <div className="example-list">
              {examples.map(item => <button type="button" key={item.title} onClick={() => applyExample(item)}>{item.title}</button>)}
            </div>
          </div>

          <label className="field-label" htmlFor="background">Choose a background</label>
          <select id="background" value={background} onChange={e => setBackground(e.target.value)}>
            <option>A lush Japanese countryside with flowers, rolling hills and a distant village</option>
            <option>A peaceful seaside village with blue water and a little harbour</option>
            <option>A magical forest with glowing fireflies and a tiny stream</option>
            <option>A cosy old town street with warm lanterns and small shops</option>
            <option>A mountain landscape with clouds, waterfalls and green valleys</option>
            <option>A dreamy city rooftop with a colourful sunset</option>
            <option>Let the AI choose a beautiful setting</option>
          </select>

          <div className="upload-box">
            <div className="upload-copy">
              <span className="upload-icon">↥</span>
              <div><strong>Reference photo <span className="optional-inline">(optional)</span></strong><small>Upload a photo to guide the character appearance · PNG, JPG or WEBP · Max 10 MB</small></div>
            </div>
            <label className="upload-button">
              {referenceImage ? "Change photo" : "Choose photo"}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} />
            </label>
            {referenceName && <div className="file-name">{referenceName}</div>}
            {preview && <img className="reference-preview" src={preview} alt="Selected reference" />}
          </div>

          <button className="generate-button" type="submit" disabled={busy}>
            {busy ? <><span className="spinner" /> Painting your scene...</> : <>✦ Generate my image <span>→</span></>}
          </button>
          <p className="privacy-note">Your API key stays on the server. Uploaded reference photos are used only for this generation request.</p>
          {error && <div className="error-box" role="alert">{error}</div>}
        </form>

        <section className="panel output-panel" aria-live="polite">
          <div className="panel-heading">
            <div><span className="step">02</span><h2>Your artwork</h2></div>
            {generatedImage && <button className="download-top" type="button" onClick={downloadImage}>↓ Download PNG</button>}
          </div>
          <div className={`artwork-stage ${generatedImage ? "has-image" : ""}`}>
            {generatedImage ? (
              <img className="generated-art" src={generatedImage} alt="AI generated hand-painted fantasy illustration" />
            ) : busy ? (
              <div className="loading-state">
                <div className="paint-orbit"><span>✿</span></div>
                <h3>Painting your little world...</h3>
                <p>This can take a little while. Keep this page open.</p>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-illustration"><span>☁</span><span>✿</span><span>☀</span></div>
                <h3>Your artwork will appear here</h3>
                <p>Add your characters and describe a moment.<br />We'll take care of the artistic details.</p>
              </div>
            )}
          </div>
          {generatedImage && (
            <div className="result-actions">
              <div><strong>Your image is ready!</strong><span>PNG · AI-generated illustration</span></div>
              <button type="button" onClick={downloadImage}>Download image ↓</button>
            </div>
          )}
          <div className="output-tip"><span>✧</span> Tip: Describe the characters, action, setting and feeling for a more personal result.</div>
        </section>
      </section>

      <footer>GHIBLI STUDIO AI <span>·</span> Made for imaginative moments</footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
