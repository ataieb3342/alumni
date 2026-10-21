import { transporter } from './config'
import { logger } from '@/lib/logger'

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Invitation à définir son mot de passe : comptes administrateurs repris du
 * Studio Sanity (mot de passe non récupérable), comptes créés par un
 * administrateur ou membres importés sans mot de passe.
 */
export async function sendUserInvitation({ email, firstName, token, isAdmin }: { email: string; firstName: string; token: string; isAdmin: boolean }) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.vh-besancon-alumni.fr'
  const url = `${base}/invitation?token=${token}`
  const name = escapeHtml(firstName || '')
  const intro = isAdmin
    ? "L'administration du site VH Besançon Alumni se fait désormais directement sur le site, et non plus dans Sanity Studio. Votre accès administrateur a été conservé."
    : 'Un compte a été préparé pour vous sur le site VH Besançon Alumni.'

  try {
    await transporter.sendMail({
      from: `"Association VH Besançon" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: isAdmin ? 'Votre accès administrateur au site VH Besançon Alumni' : 'Activez votre compte VH Besançon Alumni',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;background:#f8f5ef;font-family:Arial,sans-serif;color:#1a1d2e;line-height:1.6">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <p style="font-family:Georgia,serif;font-size:22px;font-style:italic;color:#2343c7;margin:0 0 24px">VH Besançon Alumni</p>
    <div style="background:#fffdf9;border:1px solid #e4dccd;border-radius:12px;padding:28px">
      <p style="margin-top:0">Bonjour ${name},</p>
      <p>${intro}</p>
      <p>Pour vous connecter, choisissez votre mot de passe (lien valable 7 jours) :</p>
      <p style="text-align:center;margin:28px 0">
        <a href="${url}" style="display:inline-block;background:#2343c7;color:#fff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:8px">Choisir mon mot de passe</a>
      </p>
      <p style="font-size:14px;color:#5f6475">Vous pouvez aussi vous connecter avec Google si cette adresse est un compte Google.</p>
      <p style="font-size:13px;color:#5f6475">Lien direct : ${url}</p>
    </div>
  </div>
</body></html>`,
      text: `Bonjour ${firstName},\n\n${intro}\n\nChoisissez votre mot de passe (lien valable 7 jours) : ${url}\n\nVous pouvez aussi vous connecter avec Google si cette adresse est un compte Google.`,
    })
    return { success: true }
  } catch (error) {
    logger.error("Erreur lors de l'envoi de l'invitation", error)
    return { success: false, error }
  }
}
