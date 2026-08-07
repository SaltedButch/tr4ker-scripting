export function createToastService({ id = 'tm-t4-next-toast' } = {}) {
    let hideTimer = null;

    function getOrCreateElement() {
        let toast = document.getElementById(id);
        if (toast instanceof HTMLElement) return toast;
        if (!document.body) return null;

        toast = document.createElement('div');
        toast.id = id;
        toast.setAttribute('role', 'status');
        toast.style.cssText = [
            'position:fixed', 'left:50%', 'bottom:22px', 'z-index:99999',
            'max-width:min(520px,calc(100vw - 32px))', 'padding:10px 14px',
            'border:1px solid rgba(255,255,255,0.08)', 'border-radius:10px',
            'background:rgba(24,24,27,0.96)', 'box-shadow:0 12px 30px rgba(0,0,0,0.35)',
            'font:13px/1.4 system-ui,sans-serif', 'opacity:0',
            'transform:translate(-50%,12px)', 'transition:opacity 140ms ease,transform 140ms ease',
            'pointer-events:none'
        ].join(';');
        document.body.append(toast);
        return toast;
    }

    return Object.freeze({
        show(message, { error = false, duration = 2200 } = {}) {
            const toast = getOrCreateElement();
            if (!toast) return;
            toast.textContent = String(message || '');
            toast.style.color = error ? '#fecaca' : '#fff';
            toast.style.borderColor = error ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.08)';
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%,0)';
            window.clearTimeout(hideTimer);
            hideTimer = window.setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translate(-50%,12px)';
            }, Math.max(500, Number(duration) || 2200));
        },
        destroy() {
            window.clearTimeout(hideTimer);
            document.getElementById(id)?.remove();
        }
    });
}
