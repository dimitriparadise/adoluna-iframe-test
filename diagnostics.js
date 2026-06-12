function initIframeDiagnostics(iframeId, targetUrl) {
  const iframe = document.getElementById(iframeId);
  const statusEl = document.getElementById("diag-status");
  const logEl = document.getElementById("diag-log");

  const logs = [];

  function log(message, level) {
    const entry = {
      time: new Date().toLocaleTimeString(),
      level: level || "info",
      message,
    };
    logs.push(entry);

    const li = document.createElement("li");
    li.innerHTML =
      '<span class="time">[' +
      entry.time +
      "]</span>" +
      '<span class="level">[' +
      entry.level +
      "]</span> " +
      entry.message;
    logEl.appendChild(li);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = "diag-status diag-status--" + type;
  }

  setStatus("等待加载…", "pending");
  log("父页面 origin: " + window.location.origin);
  log("目标 URL: " + targetUrl);
  log("iframe sandbox: " + (iframe.getAttribute("sandbox") || "(无)"));

  iframe.addEventListener("load", function () {
    log("iframe load 事件触发", "ok");
    setStatus("load 已触发", "ok");

    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const title = doc.title || "(无 title)";
      const bodyLen = doc.body ? doc.body.innerHTML.length : 0;
      log("可访问 iframe DOM — title: " + title + ", body 长度: " + bodyLen, "ok");
      setStatus("同源，可读取 iframe 内容", "ok");
    } catch (err) {
      log("无法读取 iframe DOM（跨域）: " + err.message, "warn");
      setStatus("跨域 — 无法读取 iframe 内容（不一定代表加载失败）", "warn");
    }

    setTimeout(function () {
      try {
        const href = iframe.contentWindow.location.href;
        log("iframe location.href: " + href, "info");
      } catch (err) {
        log("无法读取 iframe location（跨域正常）: " + err.message, "info");
      }
    }, 500);
  });

  iframe.addEventListener("error", function () {
    log("iframe error 事件触发", "error");
    setStatus("加载错误", "error");
  });

  window.addEventListener("message", function (event) {
    if (event.source === iframe.contentWindow) {
      log("收到 iframe postMessage: " + JSON.stringify(event.data), "info");
    }
  });

  fetch(targetUrl, { method: "HEAD", mode: "no-cors" })
    .then(function () {
      log("HEAD 请求完成（no-cors 模式无法读取响应头）", "info");
    })
    .catch(function (err) {
      log("HEAD 请求失败: " + err.message, "warn");
    });

  fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(targetUrl))
    .then(function (res) {
      return res.text();
    })
    .then(function () {
      log("通过代理可获取页面 HTML（说明 URL 本身可访问）", "ok");
    })
    .catch(function (err) {
      log("代理获取 HTML 失败: " + err.message, "warn");
    });

  window.reloadIframe = function () {
    log("手动重新加载 iframe", "info");
    setStatus("重新加载中…", "pending");
    iframe.src = targetUrl;
  };

  window.clearDiagLog = function () {
    logs.length = 0;
    logEl.innerHTML = "";
    log("日志已清空", "info");
  };
}
