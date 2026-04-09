export function createModalManager(elements) {
    const state = {
        config: null
    };

    function closeModal() {
        state.config = null;
        elements.modalBackdrop.classList.add("hidden");
        elements.modalForm.innerHTML = "";
        elements.modalCopy.textContent = "";
    }

    function openModal(config) {
        state.config = config;
        elements.modalEyebrow.textContent = config.eyebrow || "입력";
        elements.modalTitle.textContent = config.title || "항목";
        elements.modalCopy.textContent = config.copy || "";
        elements.modalForm.innerHTML = config.render();
        elements.modalBackdrop.classList.remove("hidden");
    }

    async function handleSubmit() {
        if (!state.config) {
            return;
        }

        const submitButton = elements.modalForm.querySelector("[data-role='modal-submit']");
        const errorElement = elements.modalForm.querySelector("[data-role='modal-error']");

        try {
            if (submitButton) {
                submitButton.disabled = true;
            }

            if (errorElement) {
                errorElement.textContent = "";
            }

            await state.config.onSubmit(elements.modalForm, new FormData(elements.modalForm));
            closeModal();

            if (typeof state.config.onComplete === "function") {
                state.config.onComplete();
            }
        } catch (error) {
            if (errorElement) {
                errorElement.textContent = error.message || "저장 중 오류가 발생했습니다.";
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    }

    return {
        closeModal,
        handleSubmit,
        openModal
    };
}
