import { transporter } from './config'
import { logger } from '@/lib/logger'

interface AlumniInvitationData {
  email: string
  firstName?: string
}

export async function sendMarketingCommunityInvitationAlumni(data: AlumniInvitationData) {
  const { email, firstName } = data
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,'

  const mailOptions = {
    from: `"Association VH Besançon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Parce que tu as aussi galéré avec ton orientation 🎓',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f3f4f6;">

        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header violet -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎓</div>
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">VH Besançon Alumni</h1>
            <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px;">Parce que tu as aussi galéré avec ton orientation</p>
          </div>

          <!-- Contenu -->
          <div style="padding: 30px;">

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              ${greeting}
            </p>

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              Tu te souviens du <strong>stress du post-bac</strong> ? De la galère pour trouver un stage de seconde ? De toutes ces questions sans réponses sur ton orientation ?
            </p>

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              Aujourd'hui, des <strong>élèves de Victor Hugo vivent exactement la même chose</strong>. Et toi, tu peux les aider.
            </p>

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              On a créé <strong style="color: #667eea;">VH Besançon Alumni</strong>, une communauté d'anciens élèves et de personnel pour :
            </p>

            <!-- Bénéfices avec focus aide -->
            <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin: 0 0 24px;">

              <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px;">
                <strong style="font-size: 18px;">🎯 Guider les élèves actuels</strong><br>
                <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Partage ton parcours, conseille-les sur leur orientation, propose des stages de seconde, aide-les à y voir plus clair. Ce que toi tu aurais aimé avoir à leur âge.
                </span>
              </p>

              <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px;">
                <strong style="font-size: 18px;">🤝 Retrouver tes camarades</strong><br>
                <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Reconnecte avec tes anciens de promo, développe ton réseau professionnel, partage tes opportunités.
                </span>
              </p>

              <p style="margin: 0; color: #1f2937; font-size: 15px;">
                <strong style="font-size: 18px;">🎉 Créer du lien entre générations</strong><br>
                <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Événements entre anciens, rencontres avec les élèves actuels, transmission d'expérience.
                </span>
              </p>

            </div>

            <p style="margin: 0 0 8px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              <strong>Tu peux faire la différence</strong> dans le parcours d'un élève.
            </p>

            <p style="margin: 0 0 24px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              L'adhésion est <strong>100% gratuite</strong> et ne prend que 2 minutes. 🚀
            </p>

            <!-- Bouton CTA -->
            <div style="text-align: center; margin: 0 0 24px;">
              <a href="https://vh-besancon-alumni.fr/alumni" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Rejoindre la communauté →
              </a>
            </div>

            <p style="margin: 0; color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.5;">
              Ou copie ce lien : <a href="https://vh-besancon-alumni.fr/alumni" style="color: #667eea;">vh-besancon-alumni.fr/alumni</a>
            </p>

          </div>

          <!-- Citation inspirante -->
          <div style="background-color: #fef3c7; padding: 20px 30px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px; font-style: italic; line-height: 1.6;">
              "L'association m'a permis de redonner ce que j'ai reçu. Guider un élève dans son orientation, c'est gratifiant et ça prend 30 minutes de son temps."
            </p>
            <p style="margin: 8px 0 0; color: #92400e; font-size: 13px; font-weight: 600;">
              — Un ancien membre du bureau
            </p>
          </div>

          <!-- Réseaux sociaux -->
          <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; font-weight: 600;">
              Suis-nous sur les réseaux
            </p>
            <p style="margin: 0;">
              <a href="https://www.linkedin.com/company/vh-besancon-alumni/" style="display: inline-block; margin: 0 8px; color: #667eea; text-decoration: none; font-weight: 600; font-size: 14px;">LinkedIn</a>
              <a href="https://www.instagram.com/vh_besancon_alumni/" style="display: inline-block; margin: 0 8px; color: #667eea; text-decoration: none; font-weight: 600; font-size: 14px;">Instagram</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 20px 30px; text-align: center; background-color: #1f2937;">
            <p style="margin: 0 0 8px; color: #ffffff; font-size: 14px; font-weight: 600;">
              VH Besançon Alumni
            </p>
            <p style="margin: 0 0 8px; color: #9ca3af; font-size: 13px;">
              Association loi 1901 • Par des anciens, pour les anciens ET les actuels
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 13px;">
              <a href="mailto:contact@vh-besancon-alumni.fr" style="color: #9ca3af; text-decoration: none;">contact@vh-besancon-alumni.fr</a>
            </p>
          </div>

        </div>

        <!-- Unsubscribe -->
        <div style="max-width: 600px; margin: 20px auto 0; text-align: center;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            Tu reçois cet email car tu es ancien(ne) élève ou personnel de Victor Hugo.
          </p>
        </div>

      </body>
      </html>
    `,
    text: `
      VH Besançon Alumni - Parce que tu as aussi galéré avec ton orientation

      ${greeting}

      Tu te souviens du stress du post-bac ? De la galère pour trouver un stage de seconde ? De toutes ces questions sans réponses sur ton orientation ?

      Aujourd'hui, des élèves de Victor Hugo vivent exactement la même chose. Et toi, tu peux les aider.

      On a créé VH Besançon Alumni, une communauté d'anciens élèves et de personnel pour :

      🎯 Guider les élèves actuels
      Partage ton parcours, conseille-les sur leur orientation, propose des stages de seconde, aide-les à y voir plus clair. Ce que toi tu aurais aimé avoir à leur âge.

      🤝 Retrouver tes camarades
      Reconnecte avec tes anciens de promo, développe ton réseau professionnel, partage tes opportunités.

      🎉 Créer du lien entre générations
      Événements entre anciens, rencontres avec les élèves actuels, transmission d'expérience.

      Tu peux faire la différence dans le parcours d'un élève.
      L'adhésion est 100% gratuite et ne prend que 2 minutes.

      Rejoindre la communauté : https://vh-besancon-alumni.fr/alumni

      "L'association m'a permis de redonner ce que j'ai reçu. Guider un élève dans son orientation, c'est gratifiant et ça prend 30 minutes de son temps."
      — Un ancien membre du bureau

      Suis-nous sur les réseaux :
      LinkedIn : https://www.linkedin.com/company/vh-besancon-alumni/
      Instagram : https://www.instagram.com/vh_besancon_alumni/

      ---
      VH Besançon Alumni
      Association loi 1901 • Par des anciens, pour les anciens ET les actuels
      contact@vh-besancon-alumni.fr

      Tu reçois cet email car tu es ancien(ne) élève ou personnel de Victor Hugo.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de l\'email de recrutement alumni:', error)
    return { success: false, error }
  }
}
