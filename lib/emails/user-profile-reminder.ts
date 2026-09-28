import { transporter } from './config'
import { logger } from '@/lib/logger'

interface ProfileReminder {
  firstName: string
  email: string
}

export async function sendUserProfileReminder({ firstName, email }: ProfileReminder) {
  const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/profil`
  const directoryUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/annuaire`

  const mailOptions = {
    from: `"Association VH Besançon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${firstName}, votre profil dans l'annuaire est encore vide`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .emoji {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
            }
            .info-box {
              background-color: #eff6ff;
              border-left: 4px solid #2563eb;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">🧭</div>
              <h1 style="margin: 0;">Votre parcours peut guider quelqu'un</h1>
            </div>
            <div class="content">
              <p>Bonjour ${firstName},</p>

              <p>Merci d'avoir rejoint VH Besançon Alumni ! Votre profil apparaît dans l'annuaire, mais il est encore vide.</p>

              <div class="info-box">
                <p style="margin: 0; color: #1e40af;">
                  Les lycéens se servent de l'annuaire pour trouver des anciens qui ont suivi la voie qui les tente :
                  une matière, une école, une ville. Sans parcours renseigné, ils ne peuvent pas vous trouver.
                </p>
              </div>

              <p>En deux minutes, vous pouvez ajouter :</p>
              <ul>
                <li><strong>Votre parcours</strong> : formations et expériences</li>
                <li><strong>Votre ville actuelle</strong></li>
                <li><strong>Jusqu'à 3 matières</strong> qui ont compté pour vous (maths, bio, langues…)</li>
              </ul>

              <div style="text-align: center;">
                <a href="${profileUrl}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">Compléter mon profil</a>
              </div>

              <p>Si le bouton ne fonctionne pas, copiez ce lien : <a href="${profileUrl}" style="color: #2563eb;">${profileUrl}</a></p>

              <p style="margin-top: 30px;">Et profitez-en pour <a href="${directoryUrl}" style="color: #2563eb;">parcourir l'annuaire</a> : vous y retrouverez peut-être d'anciens camarades.</p>
            </div>
            <div class="footer">
              <p>Association VH Besançon Alumni</p>
              <p>Ce rappel n'est envoyé qu'une seule fois.</p>
              <p><a href="mailto:contact@vh-besancon-alumni.fr" style="color: #6b7280;">contact@vh-besancon-alumni.fr</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Bonjour ${firstName},

      Merci d'avoir rejoint VH Besançon Alumni ! Votre profil apparaît dans l'annuaire, mais il est encore vide.

      Les lycéens se servent de l'annuaire pour trouver des anciens qui ont suivi la voie qui les tente :
      une matière, une école, une ville. Sans parcours renseigné, ils ne peuvent pas vous trouver.

      En deux minutes, vous pouvez ajouter :
      - Votre parcours : formations et expériences
      - Votre ville actuelle
      - Jusqu'à 3 matières qui ont compté pour vous (maths, bio, langues…)

      Compléter mon profil : ${profileUrl}

      ---
      Association VH Besançon Alumni
      Ce rappel n'est envoyé qu'une seule fois.
      contact@vh-besancon-alumni.fr
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    logger.error('Erreur lors de l\'envoi du rappel de profil:', error)
    return { success: false, error }
  }
}
