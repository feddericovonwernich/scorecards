function copyWithExecCommand(text: string, invoker: HTMLElement): boolean {
  const dialog = invoker.closest('dialog');
  if (!dialog) {
    return false;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  dialog.appendChild(textarea);

  try {
    textarea.focus({ preventScroll: true });
    textarea.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

export async function copyText(text: string, invoker: HTMLElement): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) {
      return copyWithExecCommand(text, invoker);
    }

    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return copyWithExecCommand(text, invoker);
  } finally {
    invoker.focus({ preventScroll: true });
  }
}
