import { ADMIN_INSTAGRAM } from '../api';

// Opens a Direct Message chat with the shop's Instagram account
// (the Instagram app on phones, instagram.com/direct on computers).
// Note: Instagram does not allow websites to pre-fill or send a DM,
// so the order text is copied to the clipboard for the customer to paste.
export const INSTAGRAM_DM_URL = `https://ig.me/m/${ADMIN_INSTAGRAM}`;

// DM link that also asks Instagram to pre-type `text`. Instagram does not
// officially support this: some phone app versions fill the box, but
// instagram.com on a computer ignores it. So callers still copy the text
// to the clipboard as a fallback.
export const instagramDmUrl = (text) =>
  text ? `${INSTAGRAM_DM_URL}?text=${encodeURIComponent(text)}` : INSTAGRAM_DM_URL;
export const INSTAGRAM_PROFILE_URL = `https://www.instagram.com/${ADMIN_INSTAGRAM}/`;
export const INSTAGRAM_HANDLE = `@${ADMIN_INSTAGRAM}`;

// Copies text to the clipboard. Returns true on success.
export const copyText = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the older method below
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
};
