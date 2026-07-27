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

      const name = String(nameInput.value || "").trim();
      const phone = String(phoneInput.value || "").trim();
      const email = String(emailInput.value || "").trim();
      const message = String(messageInput.value || "").trim();

      status.textContent = file ? "Изпращане с файл…" : "Изпращане…";
      if (submitBtn) submitBtn.disabled = true;

      try {
        // Same-origin API on Cloud Run → Apps Script → Gmail (attachments work)
        const body = new FormData();
        body.append("name", name);
        body.append("phone", phone);
        body.append("email", email);
        body.append("message", message);
        if (file) {
          body.append("attachment", file, file.name);
        }

        const response = await fetch("/api/contact", {
          method: "POST",
          body,
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success === false) {
          const detail = String(result.message || "");
          if (/permission|разреш|Authorization|auth/i.test(detail)) {
            throw new Error(
              "Имейл услугата още не е активирана. В Apps Script пусни testSend → Allow, после Deploy → New version."
            );
          }
          throw new Error(detail || "Send failed");
        }

        form.reset();
        status.textContent = "Благодарим Ви! Вашето запитване е изпратено успешно!";
      } catch (error) {
        status.textContent =
          (error && error.message) ||
          "Запитването не беше изпратено. Опитайте отново след малко.";
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
})();
