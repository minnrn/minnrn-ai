/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { ImgModels, ImgResult, imgModels } from "../utils/types";
import generateImage, { generate as generate_core } from "../utils/hf_img";
import "../styles/image.css";

// type GeneratedImg = {
//   censored: boolean;
//   model: string;
//   img: string | null;
//   regenerating: boolean;
// } | null;

export default function GenerateImage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const dimension = [
  //   {
  //     name: 'square',
  //     ratio: 1/1,
  //     width: 1024,
  //     height: 1024,
  //   },
  //   {
  //     name: 'portrait',
  //     ratio: 9/16,
  //     width: 576,
  //     height: 1024,
  //   },
  //   {
  //     name: 'landscape',
  //     ratio: 16/9,
  //     windth: 1024,
  //     height: 576,
  //   },
  // ];

  const [modelLoaded, setModelLoaded] = useState(false);
  const [models, setModels] = useState([] as string[]);
  const [selectedModel, setSelectedModel] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [resultsLoadCounter, setResultsLoadCounter] = useState(-1);
  const [resultsLoaded, setResultsLoaded] = useState(true);
  const [results, setResults] = useState([] as ImgResult[]);
  const [errorMessage, setErrorMessage] = useState("");

  function loadModel() {
    if (modelLoaded) return;
    setModels(imgModels);
    setModelLoaded(true);
  }

  async function generate(e: any) {
    e.preventDefault();
    if (resultsLoadCounter > -1) return;
    let intvl;
    try {
      setErrorMessage("");
      setResults([]);
      setResultsLoaded(false);

      setResultsLoadCounter(0);
      intvl = setInterval(() => {
        setResultsLoadCounter((prev) => (prev += 1));
      }, 1000);

      const res = await generateImage(
        {
          prompt,
          model: models[selectedModel] as ImgModels,
          amount: 4,
        },
        setResults,
        setResultsLoaded
      );

      if (res.code != 200) {
        setErrorMessage(res.data.message ?? "");
      }
    } catch (err) {
      setErrorMessage(`Error: ${err}`);
    } finally {
      setResultsLoaded(true);
      clearInterval(intvl);
      setResultsLoadCounter(-1);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function regenerate(prompt: string, model: ImgModels, index: number) {
    if (resultsLoadCounter > -1) return;
    let intvl;

    try {
      setResults((prev) =>
        prev.map((el, i) => {
          if (i == index) el.regenerating = true;
          return el;
        })
      );
      setResultsLoadCounter(0);
      intvl = setInterval(() => {
        setResultsLoadCounter((prev) => (prev += 1));
      }, 1000);

      const res = await generate_core(prompt, model);
      setResults((prev) =>
        prev.map((el, i) => {
          if (i == index) return res;
          return el;
        })
      );
    } catch (err) {
      console.log(`Error: ${err}`);
    } finally {
      setResults((prev) =>
        prev.map((el, i) => {
          if (i == index) el.regenerating = false;
          return el;
        })
      );
      clearInterval(intvl);
      setResultsLoadCounter(-1);
    }
  }

  function downloadImg(url: string) {
    const dowloadTag = document.createElement("a");
    dowloadTag.href = url;
    dowloadTag.download = "image.jpg";
    dowloadTag.click();
    dowloadTag.remove();
  }

  useEffect(() => {
    loadModel();

    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const SkeletonLoader = () => {
    return resultsLoadCounter > -1
      ? Array.from({ length: 4 - results.length }).map((_, i) => (
          <div className="img-container" key={i}>
            <div className="skeleton"></div>
            <div className="img-label">{resultsLoadCounter} S</div>
          </div>
        ))
      : null;
  };

  return (
    <>
      <main>
        <div className="generator-form">
          <h1 className="title">Lets Generate Image</h1>
          <div className="model-selection">
            <label htmlFor="model">Select Generation Model</label>
            <select
              name="model"
              id="model"
              onChange={(el) => setSelectedModel(Number(el.target.value))}
              value={selectedModel}
            >
              {models.map((el, i) =>
                selectedModel == i ? (
                  <option key={i} value={i}>
                    {el}
                  </option>
                ) : (
                  <option key={i} value={i}>
                    {el}
                  </option>
                )
              )}
            </select>
          </div>
          <form className="input-form" onSubmit={generate}>
            <label htmlFor="prompt"></label>
            {resultsLoadCounter > -1 ? (
              <>
                <input
                  type="text"
                  name="prompt"
                  id="prompt"
                  placeholder="Write prompt..."
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled
                />
                <button type="submit" disabled>
                  Loading
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  name="prompt"
                  id="prompt"
                  placeholder="Write prompt..."
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <button type="submit">Generate</button>
              </>
            )}
          </form>
        </div>
        <div className="img-results">
          {!resultsLoaded ? (
            <SkeletonLoader />
          ) : errorMessage.length > 1 ? (
            <p className="error-message">{errorMessage}</p>
          ) : (
            <>
              {results.map((el: ImgResult, i) => {
                if (el.regenerating) {
                  return (
                    <div className="img-container" key={i}>
                      <div className="skeleton"></div>
                      <div className="img-label">{resultsLoadCounter} S</div>
                    </div>
                  );
                }

                if (el == null || el.img == null) {
                  return (
                    <div className="img-container server-error" key={i}>
                      <p className="img-label">SERVER ERROR</p>
                      <div className="img-tooltip">
                        <svg
                          onClick={() => regenerate(el.prompt, el.model, i)}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"
                          />
                          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
                        </svg>
                      </div>
                    </div>
                  );
                } else if (el.censored) {
                  return (
                    <div className="img-container" key={i}>
                      <p className="img-label">CENSORED</p>
                      <div className="img-tooltip">
                        <svg
                          onClick={() => regenerate(el.prompt, el.model, i)}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"
                          />
                          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
                        </svg>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="img-container" key={i}>
                    <img
                      src={el.img}
                      alt={`${prompt} [${i + 1}]`}
                      loading="lazy"
                    />
                    <div className="img-tooltip">
                      <svg
                        onClick={() => regenerate(el.prompt, el.model, i)}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"
                        />
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
                      </svg>
                      <svg
                        onClick={() => downloadImg(el.img ?? "")}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        className="download-img-btn"
                        viewBox="0 0 16 16"
                      >
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                      </svg>
                    </div>
                  </div>
                );
              })}
              <SkeletonLoader />
            </>
          )}
        </div>
      </main>
    </>
  );
}
