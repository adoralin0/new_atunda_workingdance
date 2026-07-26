(() => {
  const canvas = document.querySelector("#unity-canvas");
  const btnNextMove = document.querySelector("#btn-next-move");
  const btnNextCharacter = document.querySelector("#btn-next-character");
  const btnFullscreen = document.querySelector("#btn-fullscreen");

  let unityInstance = null;

  function setControlsEnabled(enabled) {
    btnNextMove.disabled = !enabled;
    btnNextCharacter.disabled = !enabled;
    btnFullscreen.disabled = !enabled;
  }

  function callUnity(methodName, value) {
    if (!unityInstance) {
      return;
    }

    // GameObject name must match the object in your Unity scene.
    const gameObject = "WebBridge";

    try {
      if (typeof value === "undefined") {
        unityInstance.SendMessage(gameObject, methodName);
      } else {
        unityInstance.SendMessage(gameObject, methodName, value);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function unityShowBanner(msg, type) {
    const warningBanner = document.querySelector("#unity-warning");

    function updateBannerVisibility() {
      warningBanner.style.display = warningBanner.children.length ? "block" : "none";
    }

    const div = document.createElement("div");
    div.innerHTML = msg;
    warningBanner.appendChild(div);

    if (type === "error") {
      div.style.cssText = "background: red; padding: 10px; color: #fff;";
    } else {
      if (type === "warning") {
        div.style.cssText = "background: yellow; padding: 10px; color: #000;";
      }
      setTimeout(() => {
        warningBanner.removeChild(div);
        updateBannerVisibility();
      }, 5000);
    }

    updateBannerVisibility();
  }

  btnNextMove.addEventListener("click", () => callUnity("NextDanceMove"));
  btnNextCharacter.addEventListener("click", () => callUnity("NextCharacter"));
  btnFullscreen.addEventListener("click", () => {
    if (unityInstance) unityInstance.SetFullscreen(1);
  });

  const buildUrl = "Build";
  const loaderUrl = `${buildUrl}/new_atunda_working_dance_2.loader.js`;
  const config = {
    arguments: [],
    dataUrl: `${buildUrl}/new_atunda_working_dance_2.data`,
    frameworkUrl: `${buildUrl}/new_atunda_working_dance_2.framework.js`,
    codeUrl: `${buildUrl}/new_atunda_working_dance_2.wasm`,
    streamingAssetsUrl: "StreamingAssets",
    companyName: "DefaultCompany",
    productName: "UPose",
    productVersion: "0.1.0",
    showBanner: unityShowBanner,
  };

  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content =
      "width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes";
    document.head.appendChild(meta);
    document.querySelector("#unity-container").className = "unity-mobile";
    canvas.className = "unity-mobile";
  }

  document.querySelector("#unity-loading-bar").style.display = "flex";

  const script = document.createElement("script");
  script.src = loaderUrl;
  script.onload = () => {
    createUnityInstance(canvas, config, (progress) => {
      document.querySelector("#unity-progress-bar-full").style.width = `${100 * progress}%`;
    })
      .then((instance) => {
        unityInstance = instance;
        window.unityInstance = instance;
        document.querySelector("#unity-loading-bar").style.display = "none";
        setControlsEnabled(true);
      })
      .catch((message) => {
        console.error(message);
        setControlsEnabled(false);
        alert(message);
      });
  };
  script.onerror = () => {
    alert("Could not load Unity loader. Serve this folder over http://localhost (not file://).");
  };

  document.body.appendChild(script);
})();
