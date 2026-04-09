(function () {
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function annotateContextualHelp() {
    const targets = Array.from(document.querySelectorAll('[data-help-title][data-help-role]'));
    if (!targets.length) return;

    const existingTooltip = document.querySelector('.code-help-tooltip');
    if (existingTooltip) existingTooltip.remove();

    targets.forEach((el) => {
      el.classList.add('help-target');
      if (!el.hasAttribute('tabindex')) {
        el.setAttribute('tabindex', '0');
      }
    });

    const tooltip = document.createElement('div');
    tooltip.className = 'code-help-tooltip';
    tooltip.setAttribute('role', 'status');
    tooltip.setAttribute('aria-live', 'polite');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.innerHTML = '<p class="code-help-label">Aide contextuelle</p><p class="code-help-title"></p><p class="code-help-role"></p>';
    document.body.appendChild(tooltip);

    const titleEl = tooltip.querySelector('.code-help-title');
    const roleEl = tooltip.querySelector('.code-help-role');
    let activeTarget = null;
    let lastPointer = { x: 24, y: 24 };

    function positionTooltip(x, y) {
      const margin = 12;
      const rect = tooltip.getBoundingClientRect();
      let left = x + 18;
      let top = y + 18;

      if (left + rect.width > window.innerWidth - margin) {
        left = x - rect.width - 18;
      }
      if (left < margin) left = margin;

      if (top + rect.height > window.innerHeight - margin) {
        top = y - rect.height - 18;
      }
      if (top < margin) top = margin;

      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    }

    function openTooltip(target, x, y) {
      const title = target.dataset.helpTitle;
      const role = target.dataset.helpRole;
      if (!title || !role) return;

      if (activeTarget && activeTarget !== target) {
        activeTarget.classList.remove('help-active');
      }

      activeTarget = target;
      activeTarget.classList.add('help-active');
      titleEl.textContent = title;
      roleEl.textContent = role;
      tooltip.classList.add('is-visible');
      tooltip.setAttribute('aria-hidden', 'false');
      positionTooltip(x, y);
    }

    function closeTooltip(target) {
      const finalTarget = target || activeTarget;
      if (finalTarget) {
        finalTarget.classList.remove('help-active');
      }
      if (!target || target === activeTarget) {
        activeTarget = null;
        tooltip.classList.remove('is-visible');
        tooltip.setAttribute('aria-hidden', 'true');
      }
    }

    targets.forEach((target) => {
      target.addEventListener('mouseenter', (event) => {
        lastPointer = { x: event.clientX, y: event.clientY };
        openTooltip(target, event.clientX, event.clientY);
      });

      target.addEventListener('mousemove', (event) => {
        lastPointer = { x: event.clientX, y: event.clientY };
        if (activeTarget === target) {
          positionTooltip(event.clientX, event.clientY);
        }
      });

      target.addEventListener('mouseleave', () => {
        closeTooltip(target);
      });

      target.addEventListener('focus', () => {
        const rect = target.getBoundingClientRect();
        const x = rect.right - Math.min(24, rect.width / 2);
        const y = rect.top + Math.min(24, Math.max(12, rect.height / 2));
        lastPointer = { x, y };
        openTooltip(target, x, y);
      });

      target.addEventListener('blur', () => {
        closeTooltip(target);
      });
    });

    window.addEventListener('scroll', () => {
      if (activeTarget) {
        positionTooltip(lastPointer.x, lastPointer.y);
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (activeTarget) {
        positionTooltip(lastPointer.x, lastPointer.y);
      }
    });
  }

  function initQcm() {
    const qcmSection = document.getElementById('qcm-final') || document.querySelector('.qcm-card') || document.querySelector('section[id*="qcm"]');
    if (!qcmSection) return;

    const questions = Array.from(qcmSection.querySelectorAll('.qcm-question'));
    const submitButton = qcmSection.querySelector('.qcm-submit');
    const overlay = qcmSection.parentElement?.querySelector('.qcm-overlay') || document.getElementById('qcmOverlay') || document.querySelector('.qcm-overlay');
    const modalLabel = overlay ? overlay.querySelector('.qcm-modal-label') : null;
    const modalTitle = overlay ? overlay.querySelector('.qcm-modal-title') : null;
    const modalText = overlay ? overlay.querySelector('.qcm-modal-text') : null;
    const hintsWrap = overlay ? overlay.querySelector('.qcm-modal-hints') : null;
    const hintsList = overlay ? overlay.querySelector('.qcm-hints-list, .qcm-hints') : null;
    const retryButton = overlay ? overlay.querySelector('.qcm-retry') : null;
    const closeButton = overlay ? overlay.querySelector('.qcm-close') : null;

    if (!questions.length || !submitButton || !overlay || !modalLabel || !modalTitle || !modalText || !hintsWrap || !hintsList || !retryButton || !closeButton) {
      return;
    }

    qcmSection.querySelectorAll('.qcm-option input[type="radio"]').forEach((input) => {
      input.addEventListener('change', () => {
        const name = input.name;
        qcmSection.querySelectorAll('input[name="' + name + '"]').forEach((item) => {
          const label = item.closest('.qcm-option');
          if (label) label.classList.toggle('is-selected', item.checked);
        });
      });
    });

    function openOverlay(type, score, hints) {
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');

      if (type === 'success') {
        modalLabel.textContent = 'Validation réussie';
        modalTitle.textContent = 'Résultat du QCM';
        modalText.textContent = 'Bravo. Tu as obtenu ' + score + ' bonnes réponses sur 10. La leçon est validée et tu peux poursuivre avec confiance.';
        hintsWrap.hidden = true;
        hintsList.innerHTML = '';
        retryButton.hidden = true;
        closeButton.textContent = 'Fermer';
      } else {
        modalLabel.textContent = 'Validation à reprendre';
        modalTitle.textContent = 'Résultat du QCM';
        modalText.textContent = 'Le nombre de tes réponses correctes était insuffisant : ' + score + ' sur 10. Relis les parties indiquées puis recommence.';
        hintsWrap.hidden = false;
        hintsList.innerHTML = '';
        hints.slice(0, 5).forEach((hint) => {
          const li = document.createElement('li');
          li.textContent = hint;
          hintsList.appendChild(li);
        });
        retryButton.hidden = false;
        closeButton.textContent = 'Fermer';
      }

      (type === 'success' ? closeButton : retryButton).focus();
    }

    function closeOverlay() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
    }

    function resetQcm() {
      questions.forEach((question) => {
        question.querySelectorAll('input[type="radio"]').forEach((input) => {
          input.checked = false;
        });
        question.querySelectorAll('.qcm-option').forEach((label) => label.classList.remove('is-selected'));
      });
      closeOverlay();
      qcmSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        const firstInput = qcmSection.querySelector('input[type="radio"]');
        if (firstInput) firstInput.focus();
      }, 250);
    }

    submitButton.addEventListener('click', () => {
      let score = 0;
      const hints = [];
      questions.forEach((question) => {
        const correct = question.dataset.correct;
        const selected = question.querySelector('input[type="radio"]:checked');
        if (selected && selected.value === correct) {
          score += 1;
        } else {
          const hint = question.dataset.hint;
          if (hint && !hints.includes(hint)) hints.push(hint);
        }
      });

      openOverlay(score >= 6 ? 'success' : 'failure', score, hints);
    });

    retryButton.addEventListener('click', resetQcm);

    closeButton.addEventListener('click', () => {
      closeOverlay();
      submitButton.focus();
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeOverlay();
        submitButton.focus();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeOverlay();
        submitButton.focus();
      }
    });
  }

  onReady(function () {
    const exportButton = document.getElementById('exportPdf');
    if (exportButton) {
      exportButton.addEventListener('click', function () { window.print(); });
    }
    annotateContextualHelp();
    initQcm();
  });
})();
