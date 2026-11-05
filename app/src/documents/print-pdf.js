/* ============================================================
   Kalanso — enregistrement d'un document PDF en un clic
   Le renderer construit le HTML, Electron l'imprime en A4 et
   propose l'emplacement d'enregistrement.
   ============================================================ */

export async function printPdf(html, filename) {
  try {
    const result = await window.desktopAPI?.savePdf?.({ html, filename });
    if (!result?.ok) {
      if (result?.canceled) return { ok: false, canceled: true };
      return {
        ok: false,
        message: result?.message || 'Génération du PDF impossible.',
      };
    }
    return { ok: true, path: result.path };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'Génération du PDF impossible.',
    };
  }
}
