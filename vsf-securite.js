/* Vérification du mot de passe maître dans Supabase ; aucun mot de passe ici. */
(() => {
  'use strict';
  const BASE = 'https://xndpmjuzdqwexnligrwh.supabase.co';
  const CLE = 'sb_publishable_Pe-GumqkZJFYJj8trS4rWg_KVO_ANhW';
  const IDS = ['hinser', 'dinchr'];
  const MODE = document.currentScript?.dataset.vsfProtection;
  const originalFetch = window.fetch.bind(window);
  let credentials = null;
  const lireSession = () => {
    try { return JSON.parse(sessionStorage.getItem('vsf_maitre') || 'null'); } catch { return null; }
  };
  window.fetch = (input, options = {}) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
    if (url.origin !== BASE || !url.pathname.startsWith('/rest/v1/')) return originalFetch(input, options);
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(options.headers).forEach((value, key) => headers.set(key, value));
    const session = lireSession();
    if (session?.jeton) headers.set('x-vsf-admin-session', session.jeton);
    if (credentials) {
      headers.set('x-vsf-reservation-id', credentials.id);
      headers.set('x-vsf-reservation-licence', credentials.licence);
    }
    return originalFetch(input, { ...options, headers });
  };
  async function rpc(nom, parametres) {
    const reponse = await originalFetch(BASE + '/rest/v1/rpc/' + nom, {
      method: 'POST', headers: { apikey: CLE, 'Content-Type': 'application/json' },
      body: JSON.stringify(parametres), cache: 'no-store'
    });
    if (!reponse.ok) throw new Error('Vérification indisponible. Réessayez dans quelques instants.');
    return reponse.json();
  }
  async function deconnecter() {
    const session = lireSession();
    sessionStorage.removeItem('vsf_maitre');
    sessionStorage.removeItem('vsf_admin');
    credentials = null;
    if (session?.jeton) {
      try { await rpc('vsf_fermer_session_admin', { p_jeton: session.jeton }); } catch {}
    }
  }
  async function demanderMaitre(compte, licence) {
    if (!IDS.includes(compte.identifiant)) return false;
    await deconnecter();
    return new Promise(resolve => {
      const dialogue = document.createElement('dialog');
      dialogue.style.cssText = 'width:min(420px,calc(100% - 32px));box-sizing:border-box;border:1px solid var(--or);border-radius:14px;background:var(--fond-carte);color:var(--texte);padding:1.6rem;font-family:var(--police-texte);';
      dialogue.innerHTML = '<form><h2>Accès administrateur</h2><p>Entrez le mot de passe maître.</p><div class="champ-login"><label for="vsf-mot-maitre">Mot de passe maître</label><input id="vsf-mot-maitre" type="password" autocomplete="current-password" maxlength="2048" required spellcheck="false"></div><button class="bouton-connexion" type="submit">Valider</button><p role="status" class="msg-erreur"></p><button class="btn-deco" type="button">Annuler</button></form>';
      const form = dialogue.querySelector('form');
      const champ = dialogue.querySelector('input');
      const statut = dialogue.querySelector('[role="status"]');
      const valider = dialogue.querySelector('[type="submit"]');
      const fermer = resultat => { champ.value = ''; dialogue.close(); dialogue.remove(); resolve(resultat); };
      dialogue.querySelector('[type="button"]').onclick = () => fermer(false);
      dialogue.addEventListener('cancel', evt => { evt.preventDefault(); fermer(false); });
      form.onsubmit = async evt => {
        evt.preventDefault();
        valider.disabled = true; statut.textContent = 'Vérification…';
        try {
          const resultat = await rpc('vsf_verifier_maitre', {
            p_identifiant: compte.identifiant, p_licence: licence, p_mot_de_passe: champ.value
          });
          champ.value = '';
          if (!resultat?.ok) { statut.textContent = resultat?.message || 'Connexion refusée.'; champ.focus(); return; }
          sessionStorage.setItem('vsf_maitre', JSON.stringify({ jeton: resultat.jeton, identifiant: resultat.identifiant }));
          fermer(true);
        } catch (erreur) { champ.value = ''; statut.textContent = erreur.message; }
        finally { valider.disabled = false; }
      };
      document.body.appendChild(dialogue);
      dialogue.showModal(); champ.focus();
    });
  }
  window.VSFSecurite = {
    demanderMaitre, deconnecter,
    identifierLicencie(id, licence) { credentials = { id, licence }; },
    async validerSession() {
      const session = lireSession();
      if (!session?.jeton) return null;
      return rpc('vsf_session_admin', { p_jeton: session.jeton });
    }
  };
  if (MODE) {
    let compte;
    try { compte = JSON.parse(sessionStorage.getItem('vsf_admin') || 'null'); } catch {}
    const admin = IDS.includes(compte?.identifiant);
    if (MODE === 'admin' || admin) {
      const masque = document.createElement('style');
      masque.textContent = 'html { visibility: hidden !important; }';
      document.head.appendChild(masque);
      (async () => {
        try {
          const identifiant = await window.VSFSecurite.validerSession();
          if (!admin || identifiant !== compte.identifiant) throw new Error('Connexion requise');
          masque.remove();
        } catch {
          await deconnecter(); location.replace('reservation.html');
        }
      })();
    }
  }
})();
