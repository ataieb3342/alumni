import { transporter } from './config'
import { logger } from '@/lib/logger'

interface MemberCreateAccountData {
  email: string
  firstName?: string
}

export async function sendMarketingMembersCreateAccount(data: MemberCreateAccountData) {
  const { email, firstName } = data
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,'

  const mailOptions = {
    from: `"Association VH Besançon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Créez votre compte VH Besançon Alumni ! 🎓',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f3f4f6;">

        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header violet -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎓</div>
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">VH Besançon Alumni</h1>
            <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px;">Rejoignez la plateforme en ligne</p>
          </div>

          <!-- Contenu -->
          <div style="padding: 30px;">

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              ${greeting}
            </p>

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              Vous êtes <strong>adhérent(e)</strong> de l'association VH Besançon Alumni, mais vous n'avez pas encore de compte sur notre plateforme en ligne. 🌟
            </p>

            <p style="margin: 0 0 24px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              Créez votre compte dès maintenant pour profiter de tous les avantages de la communauté et rester connecté avec les anciens élèves et le personnel de Victor Hugo !
            </p>

            <!-- Avantages avec la plateforme -->
            <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
              <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px; font-weight: bold;">
                ✨ Avec votre compte, vous pouvez :
              </p>

              <p style="margin: 0 0 12px; color: #1f2937; font-size: 15px;">
                <strong>🌐 Compléter votre profil</strong><br>
                <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Ajoutez votre parcours, vos compétences et vos coordonnées pour vous faire connaître de la communauté
                </span>
              </p>

              <p style="margin: 0 0 12px; color: #1f2937; font-size: 15px;">
                <strong>💼 Accéder aux offres de stage et d'emploi</strong><br>
                <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Consultez et proposez des opportunités professionnelles au sein du réseau
                </span>
              </p>

              <p style="margin: 0 0 12px; color: #1f2937; font-size: 15px;">
                <strong>📢 Publier des annonces</strong><br>
                <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Partagez vos événements, recherches ou opportunités avec toute la communauté
                </span>
              </p>

              <p style="margin: 0; color: #1f2937; font-size: 15px;">
                <strong>🤝 Échanger avec les membres</strong><br>
                <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Retrouvez vos anciens camarades, développez votre réseau professionnel et aidez les élèves actuels
                </span>
              </p>
            </div>

            <p style="margin: 0 0 8px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              <strong>L'inscription ne prend que 2 minutes</strong> et vous permettra de profiter pleinement de votre adhésion ! 🚀
            </p>

            <p style="margin: 0 0 24px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              Utilisez cette adresse email (<strong>${email}</strong>) lors de votre inscription.
            </p>

            <!-- Bouton CTA -->
            <div style="text-align: center; margin: 0 0 24px;">
              <a href="https://vh-besancon-alumni.fr/inscription" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Créer mon compte →
              </a>
            </div>

            <p style="margin: 0; color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.5;">
              Ou copie ce lien : <a href="https://vh-besancon-alumni.fr/inscription" style="color: #667eea;">vh-besancon-alumni.fr/inscription</a>
            </p>

          </div>

          <!-- Note importante -->
          <div style="background-color: #fef3c7; padding: 20px 30px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
              <strong>💡 Important :</strong><br>
              Lors de votre inscription, assurez-vous d'utiliser l'adresse email <strong>${email}</strong> pour que votre adhésion soit correctement associée à votre compte.
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
            Vous recevez cet email car vous êtes adhérent(e) de l'association.
          </p>
        </div>

      </body>
      </html>
    `,
    text: `
      VH Besançon Alumni - Rejoignez la plateforme en ligne

      ${greeting}

      Vous êtes adhérent(e) de l'association VH Besançon Alumni, mais vous n'avez pas encore de compte sur notre plateforme en ligne.

      Créez votre compte dès maintenant pour profiter de tous les avantages de la communauté et rester connecté avec les anciens élèves et le personnel de Victor Hugo !

      ✨ Avec votre compte, vous pouvez :

      🌐 Compléter votre profil
      Ajoutez votre parcours, vos compétences et vos coordonnées pour vous faire connaître de la communauté

      💼 Accéder aux offres de stage et d'emploi
      Consultez et proposez des opportunités professionnelles au sein du réseau

      📢 Publier des annonces
      Partagez vos événements, recherches ou opportunités avec toute la communauté

      🤝 Échanger avec les membres
      Retrouvez vos anciens camarades, développez votre réseau professionnel et aidez les élèves actuels

      L'inscription ne prend que 2 minutes et vous permettra de profiter pleinement de votre adhésion !

      Utilisez cette adresse email (${email}) lors de votre inscription.

      Créer mon compte : https://vh-besancon-alumni.fr/inscription

      💡 Important :
      Lors de votre inscription, assurez-vous d'utiliser l'adresse email ${email} pour que votre adhésion soit correctement associée à votre compte.

      Suis-nous sur les réseaux :
      LinkedIn : https://www.linkedin.com/company/vh-besancon-alumni/
      Instagram : https://www.instagram.com/vh_besancon_alumni/

      ---
      VH Besançon Alumni
      Association loi 1901 • Par des anciens, pour les anciens ET les actuels
      contact@vh-besancon-alumni.fr

      Vous recevez cet email car vous êtes adhérent(e) de l'association.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de l\'email de création de compte adhérent:', error)
    return { success: false, error }
  }
}
