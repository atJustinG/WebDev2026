let currentUser = null;
let map = null;
let markers = [];

// Replaces the native confirm() dialog with an inline UI element next to the button that triggered it.
function showInlineConfirm(trigger, message, onConfirm) {
    document.querySelectorAll('.inline-confirm').forEach(el => el.remove());

    const anchor = trigger.closest('.item-actions, .form-actions') || trigger;
    const div = document.createElement('div');
    div.className = 'inline-confirm';
    div.innerHTML = `<span>${message}</span>
        <button class="btn-small btn-danger">${t('confirmYes')}</button>
        <button class="btn-small btn-secondary">${t('confirmCancel')}</button>`;

    anchor.insertAdjacentElement('afterend', div);
    div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    div.querySelectorAll('button')[0].addEventListener('click', () => { div.remove(); onConfirm(); });
    div.querySelectorAll('button')[1].addEventListener('click', () => div.remove());
}
