(() => {
  const canvas = document.querySelector("#unity-canvas");
  const container = document.querySelector("#unity-container");
  const btnPrevMove = document.querySelector("#btn-prev-move");
  const btnNextMove = document.querySelector("#btn-next-move");
  const btnPrevCharacter = document.querySelector("#btn-prev-character");
  const btnNextCharacter = document.querySelector("#btn-next-character");
  const btnFullscreen = document.querySelector("#btn-fullscreen");
  const btnExitFullscreen = document.querySelector("#btn-exit-fullscreen");

  const controlButtons = [
    btnPrevMove,
    btnNextMove,
    btnPrevCharacter,
    btnNextCharacter,
    btnFullscreen,
  ];

  let unityInstance = null;

  function setControlsEnabled(enabled) {
    controlButtons.forEach((btn) => {
      if (btn) btn.disabled = !enabled;
    });
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

  // CharacterSelector lives on this GameObject (same as in-game arrows).
  const characterSelectorObject = "Characters (1)";
  let cachedDanceCount = null;

  async function getDanceCount() {
    if (cachedDanceCount != null) {
      return cachedDanceCount;
    }

    try {
      const response = await fetch("StreamingAssets/atunda/dances.manifest.json", {
        cache: "no-cache",
      });
      const dances = await response.json();
      cachedDanceCount = Array.isArray(dances) ? dances.length : 0;
    } catch (err) {
      console.error("Failed to load dance list:", err);
      cachedDanceCount = 0;
    }

    return cachedDanceCount;
  }

  function nextCharacter() {
    callUnity("NextCharacter");
  }

  function previousCharacter() {
    if (!unityInstance) return;
    try {
      // Works with current builds: CharacterSelector.PreviousCharacter already exists.
      unityInstance.SendMessage(characterSelectorObject, "PreviousCharacter");
    } catch (err) {
      console.error(err);
      callUnity("PreviousCharacter");
    }
  }

  function nextDanceMove() {
    callUnity("NextDanceMove");
  }

  // Current WebGL build has NextDanceMove but not PreviousDanceMove.
  // Calling next (count - 1) times wraps to the previous dance.
  async function previousDanceMove() {
    if (!unityInstance) return;

    const count = await getDanceCount();
    if (count <= 0) {
      callUnity("PreviousDanceMove");
      return;
    }

    if (count === 1) {
      callUnity("NextDanceMove");
      return;
    }

    for (let i = 0; i < count - 1; i++) {
      callUnity("NextDanceMove");
    }
  }

  function getFullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement ||
      null
    );
  }

  function isImmersive() {
    return document.body.classList.contains("immersive");
  }

  function updateFullscreenButton() {
    const on = !!getFullscreenElement() || isImmersive();
    if (btnFullscreen) {
      btnFullscreen.textContent = on ? "Exit fullscreen" : "Fullscreen";
    }
    if (btnExitFullscreen) {
      btnExitFullscreen.hidden = !on;
    }
  }

  async function requestDomFullscreen(el) {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return true;
    }
    if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
      return true;
    }
    if (el.webkitRequestFullScreen) {
      el.webkitRequestFullScreen();
      return true;
    }
    if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
      return true;
    }
    return false;
  }

  async function exitDomFullscreen() {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      return;
    }
    if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      return;
    }
    if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
      return;
    }
    if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }

  // Unity SetFullscreen often fails on mobile. Prefer browser Fullscreen API,
  // with a CSS immersive fallback for iOS Safari.
  async function toggleFullscreen() {
    const target = container || canvas;

    if (getFullscreenElement()) {
      await exitDomFullscreen();
      document.body.classList.remove("immersive");
      updateFullscreenButton();
      return;
    }

    if (isImmersive()) {
      document.body.classList.remove("immersive");
      updateFullscreenButton();
      return;
    }

    let entered = false;
    try {
      entered = await requestDomFullscreen(target);
    } catch (err) {
      console.warn("Browser fullscreen failed:", err);
      entered = false;
    }

    if (!entered) {
      // iOS / restricted mobile browsers
      document.body.classList.add("immersive");
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("landscape").catch(() => {});
        }
      } catch (_) {
        /* ignore */
      }
    } else if (unityInstance && typeof unityInstance.SetFullscreen === "function") {
      try {
        unityInstance.SetFullscreen(1);
      } catch (_) {
        /* ignore — DOM fullscreen already applied */
      }
    }

    updateFullscreenButton();
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

  btnPrevMove.addEventListener("click", () => {
    previousDanceMove();
  });
  btnNextMove.addEventListener("click", () => nextDanceMove());
  btnPrevCharacter.addEventListener("click", () => previousCharacter());
  btnNextCharacter.addEventListener("click", () => nextCharacter());
  btnFullscreen.addEventListener("click", () => {
    toggleFullscreen();
  });
  if (btnExitFullscreen) {
    btnExitFullscreen.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFullscreen();
    });
  }

  document.addEventListener("fullscreenchange", updateFullscreenButton);
  document.addEventListener("webkitfullscreenchange", updateFullscreenButton);

  // Public JS API for embedding / console use
  window.atundaApi = {
    nextDanceMove,
    previousDanceMove,
    nextCharacter,
    previousCharacter,
    toggleFullscreen,
  };

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
        updateFullscreenButton();
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

  // Stronger press feedback on touch / mouse for website buttons.
  document.querySelectorAll(".btn, .exit-fullscreen-btn").forEach((btn) => {
    const press = () => {
      if (!btn.disabled) btn.classList.add("is-pressed");
    };
    const release = () => btn.classList.remove("is-pressed");
    btn.addEventListener("pointerdown", press);
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointerleave", release);
    btn.addEventListener("pointercancel", release);
  });
})();
