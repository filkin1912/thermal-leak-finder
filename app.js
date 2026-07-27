(() => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#site-nav");
  const form = document.querySelector("#contact-form");
  const status = document.querySelector("#form-status");
  const hero = document.querySelector(".hero-content") || document.querySelector(".hero");
  const header = document.querySelector(".site-header");

  const syncHeaderHeight = () => {
    if (!header) return;
    document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`);
  };

  syncHeaderHeight();
  window.addEventListener("resize", syncHeaderHeight);

  const headerOffset = () => (header ? header.offsetHeight : 0);

  const scrollToTarget = (target, behavior = "smooth") => {
    if (!target) return;
    syncHeaderHeight();
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset());
    window.scrollTo({ top, behavior });
  };

  const scrollHome = (event) => {
    event.preventDefault();
    if (hero) {
      scrollToTarget(hero, "smooth");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    history.replaceState(null, "", window.location.pathname || "/");
  };

  document.querySelectorAll("a.logo").forEach((logo) => {
    logo.addEventListener("click", scrollHome);
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      scrollToTarget(target, "smooth");
      history.pushState(null, "", id);
      if (nav && toggle) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-label", "Отвори меню");
      }
    });
  });

  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      window.setTimeout(() => scrollToTarget(target, "auto"), 0);
    }
  }

  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-label", open ? "Затвори меню" : "Отвори меню");
    };

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  if (form && status) {
    // Create key at https://web3forms.com while logged in as hydroinspect@gmail.com
    const WEB3FORMS_ACCESS_KEY = "3f00e71d-0b22-4d02-be8e-e80a3ae777a9";
    // Used when a file is attached (Web3Forms free plan has no attachments)
    const ATTACHMENT_SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbz_g_l4qRYuCLZokUulYcVVktgdBxspoq0eASGIufhQJsmXEwsTLliBMuy0l_iBFBIx/exec";
    const MAX_FILE_BYTES = 4 * 1024 * 1024;
    const submitBtn = form.querySelector('button[type="submit"]');
    const nameInput = form.querySelector("#name");
    const phoneInput = form.querySelector("#phone");
    const emailInput = form.querySelector("#email");
    const messageInput = form.querySelector("#message");
    const fileInput = form.querySelector("#attachment");

    const PHONE_RE = /^(?:0\d{8,14}|\+[1-9]\d{7,14})$/;
    const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const ALLOWED_TYPES = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ]);

    const sanitizePhone = () => {
      let value = phoneInput.value;
      const startsWithPlus = value.trimStart().startsWith("+");
      const digits = value.replace(/\D/g, "");
      phoneInput.value = startsWithPlus ? `+${digits}` : digits;
    };

    const normalizePhone = () => {
      let value = phoneInput.value.trim();
      const startsWithPlus = value.startsWith("+");
      const digits = value.replace(/\D/g, "");
      value = startsWithPlus ? `+${digits}` : digits;
      phoneInput.value = value;
      return value;
    };

    const showInvalid = (input, message) => {
      input.setCustomValidity(message);
      input.reportValidity();
      status.textContent = message;
    };

    const readFileAsBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          resolve(result.includes(",") ? result.split(",")[1] : result);
        };
        reader.onerror = () => reject(reader.error || new Error("read failed"));
        reader.readAsDataURL(file);
      });

    const uploadFileForEmail = async (file) => {
      // Primary: tmpfiles.org (works from browser, returns viewable link)
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("expire", "172800"); // 48 hours
        const res = await fetch("https://tmpfiles.org/api/v1/upload", {
          method: "POST",
          body,
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.status === "success" && json.data && json.data.url) {
          return {
            fileUrl: String(json.data.url).replace("tmpfiles.org/", "tmpfiles.org/dl/"),
            fileName: file.name,
          };
        }
      } catch (error) {
        // fall through to Apps Script
      }

      // Fallback: Google Drive via Apps Script
      const attachment = await readFileAsBase64(file);
      const uploadRes = await fetch(ATTACHMENT_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "upload",
          attachment,
          attachmentName: file.name,
          attachmentType: file.type,
        }),
      });
      const uploadJson = await uploadRes.json().catch(() => ({}));
      if (uploadRes.ok && uploadJson.success && uploadJson.fileUrl) {
        return {
          fileUrl: uploadJson.fileUrl,
          fileName: uploadJson.fileName || file.name,
        };
      }

      throw new Error("upload failed");
    };

    if (phoneInput) {
      phoneInput.addEventListener("input", () => {
        sanitizePhone();
        phoneInput.setCustomValidity("");
      });
      phoneInput.addEventListener("paste", () => {
        window.requestAnimationFrame(() => {
          sanitizePhone();
          phoneInput.setCustomValidity("");
        });
      });
    }

    if (emailInput) {
      emailInput.addEventListener("input", () => emailInput.setCustomValidity(""));
    }

    if (nameInput) {
      nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));
    }

    if (messageInput) {
      messageInput.addEventListener("input", () => messageInput.setCustomValidity(""));
    }

    if (fileInput) {
      fileInput.addEventListener("change", () => {
        fileInput.setCustomValidity("");
        status.textContent = "";
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (nameInput) {
        nameInput.value = nameInput.value.trim();
        if (nameInput.value.length < 2) {
          showInvalid(nameInput, "Моля, въведете вашето име.");
          return;
        }
        nameInput.setCustomValidity("");
      }

      if (phoneInput) {
        const value = normalizePhone();
        if (!PHONE_RE.test(value)) {
          showInvalid(
            phoneInput,
            "Невалиден телефонен номер. Използвайте формат 0881234567 или +359881234567."
          );
          return;
        }
        phoneInput.setCustomValidity("");
      }

      if (emailInput) {
        emailInput.value = emailInput.value.trim();
        if (!EMAIL_RE.test(emailInput.value)) {
          showInvalid(emailInput, "Неправилно изписан имейл адрес!");
          return;
        }
        emailInput.setCustomValidity("");
      }

      if (messageInput) {
        messageInput.value = messageInput.value.trim();
        if (messageInput.value.length < 3) {
          showInvalid(messageInput, "Моля, въведете кратко съобщение.");
          return;
        }
        messageInput.setCustomValidity("");
      }

      const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      if (file) {
        if (!ALLOWED_TYPES.has(file.type)) {
          showInvalid(fileInput, "Позволени са само изображения (JPG, PNG, WEBP, GIF) или PDF.");
          return;
        }
        if (file.size > MAX_FILE_BYTES) {
          showInvalid(fileInput, "Файлът е твърде голям. Максимум 4 MB.");
          return;
        }
        fileInput.setCustomValidity("");
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        status.textContent = "Моля, попълнете всички задължителни полета.";
        return;
      }

      if (!WEB3FORMS_ACCESS_KEY) {
        status.textContent =
          "Формата още не е свързана. Нужен е Web3Forms access key за hydroinspect@gmail.com.";
        return;
      }

      const name = String(nameInput.value || "").trim();
      const phone = String(phoneInput.value || "").trim();
      const email = String(emailInput.value || "").trim();
      const message = String(messageInput.value || "").trim();

      status.textContent = "Изпращане…";
      if (submitBtn) submitBtn.disabled = true;

      try {
        let fileUrl = "";
        let fileName = "";

        // Optional upload — never blocks the main Web3Forms email
        if (file) {
          status.textContent = "Качване на файла…";
          try {
            const uploaded = await uploadFileForEmail(file);
            fileUrl = uploaded.fileUrl;
            fileName = uploaded.fileName;
          } catch (uploadError) {
            fileUrl = "";
          }
        }

        status.textContent = "Изпращане…";
        const payload = {
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: "Хидроинспект — ново запитване",
          from_name: "Хидроинспект",
          replyto: email,
          Име: name,
          Телефон: phone,
          Имейл: email,
          Съобщение: message,
        };

        if (fileUrl) {
          payload["Прикачен файл"] = fileUrl;
          payload["Име на файла"] = fileName;
        } else if (file) {
          payload["Прикачен файл"] =
            "Файлът не можа да се качи. Клиентът опита да прикачи: " + file.name;
        }

        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Send failed");
        }

        form.reset();
        status.textContent = "Благодарим Ви! Вашето запитване е изпратено успешно!";
      } catch (error) {
        status.textContent =
          "Запитването не беше изпратено. Проверете интернет връзката или опитайте отново.";
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
})();
