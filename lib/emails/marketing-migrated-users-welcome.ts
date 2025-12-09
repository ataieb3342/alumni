import { transporter } from './config'
import { logger } from '@/lib/logger'

interface MigratedUserData {
  email: string
  firstName?: string
}

export async function sendMarketingMigratedUsersWelcome(data: MigratedUserData) {
  const { email, firstName } = data
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,'

  const mailOptions = {
    from: `"Association VH Besançon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Bienvenue sur le nouveau site VH Besançon Alumni ! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f3f4f6;">

        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header violet -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Nouveau site VH Besançon Alumni</h1>
            <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px;">Votre compte a été migré</p>
          </div>

          <!-- Contenu -->
          <div style="padding: 30px;">

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              ${greeting}
            </p>

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              Bonne nouvelle ! Nous avons migré votre compte vers notre tout nouveau site <strong style="color: #667eea;">VH Besançon Alumni</strong>. 🚀
            </p>

            <p style="margin: 0 0 24px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              Pour des raisons de sécurité, nous vous invitons à <strong>réinitialiser votre mot de passe</strong> et à <strong>mettre à jour vos informations</strong> dès votre première connexion.
            </p>

            <!-- Étapes à suivre -->
            <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
              <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px; font-weight: bold;">
                📋 Étapes à suivre :
              </p>

              <p style="margin: 0 0 12px; color: #1f2937; font-size: 15px;">
                <strong>1. Réinitialisez votre mot de passe</strong><br>
                <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Rendez-vous sur la page de connexion et cliquez sur "Mot de passe oublié ?"
                </span>
              </p>

              <p style="margin: 0 0 12px; color: #1f2937; font-size: 15px;">
                <strong>2. Mettez à jour vos informations</strong><br>
                <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Une fois connecté, vérifiez et complétez votre profil (formation, expérience, coordonnées...)
                </span>
              </p>

              <p style="margin: 0; color: #1f2937; font-size: 15px;">
                <strong>3. Découvrez les nouveautés</strong><br>
                <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Explorez les nouvelles fonctionnalités et les améliorations que nous avons apportées
                </span>
              </p>
            </div>

            <!-- Nouveautés -->
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
              <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px; font-weight: bold;">
                ✨ Quoi de neuf ?
              </p>

              <p style="margin: 0 0 12px; color: #1f2937; font-size: 14px; line-height: 1.6;">
                • <strong>Interface modernisée</strong> : Plus intuitive et agréable à utiliser<br>
                • <strong>Nouvelles fonctionnalités</strong> : Gestion améliorée des offres de stage et d'emploi<br>
                • <strong>Performance optimisée</strong> : Navigation plus rapide et fluide<br>
                • <strong>Meilleure connexion</strong> : Retrouvez plus facilement les anciens élèves
              </p>
            </div>

            <!-- Bouton CTA -->
            <div style="text-align: center; margin: 0 0 24px;">
              <a href="https://vh-besancon-alumni.fr/mot-de-passe-oublie" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Réinitialiser mon mot de passe →
              </a>
            </div>

            <p style="margin: 0; color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.5;">
              Ou copie ce lien : <a href="https://vh-besancon-alumni.fr/mot-de-passe-oublie" style="color: #667eea;">vh-besancon-alumni.fr/mot-de-passe-oublie</a>
            </p>

          </div>

          <!-- Note importante -->
          <div style="background-color: #fef3c7; padding: 20px 30px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
              <strong>💡 Besoin d'aide ?</strong><br>
              Si vous rencontrez des difficultés lors de la migration de votre compte, n'hésitez pas à nous contacter à <a href="mailto:contact@vh-besancon-alumni.fr" style="color: #92400e; text-decoration: underline;">contact@vh-besancon-alumni.fr</a>
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
            Vous recevez cet email car votre compte a été migré vers le nouveau site.
          </p>
        </div>

      </body>
      </html>
    `,
    text: `
      VH Besançon Alumni - Nouveau site

      ${greeting}

      Bonne nouvelle ! Nous avons migré votre compte vers notre tout nouveau site VH Besançon Alumni.

      Pour des raisons de sécurité, nous vous invitons à réinitialiser votre mot de passe et à mettre à jour vos informations dès votre première connexion.

      📋 Étapes à suivre :

      1. Réinitialisez votre mot de passe
      Rendez-vous sur la page de connexion et cliquez sur "Mot de passe oublié ?"

      2. Mettez à jour vos informations
      Une fois connecté, vérifiez et complétez votre profil (formation, expérience, coordonnées...)

      3. Découvrez les nouveautés
      Explorez les nouvelles fonctionnalités et les améliorations que nous avons apportées

      ✨ Quoi de neuf ?
      • Interface modernisée : Plus intuitive et agréable à utiliser
      • Nouvelles fonctionnalités : Gestion améliorée des offres de stage et d'emploi
      • Performance optimisée : Navigation plus rapide et fluide
      • Meilleure connexion : Retrouvez plus facilement les anciens élèves

      Réinitialiser mon mot de passe : https://vh-besancon-alumni.fr/mot-de-passe-oublie

      💡 Besoin d'aide ?
      Si vous rencontrez des difficultés lors de la migration de votre compte, n'hésitez pas à nous contacter à contact@vh-besancon-alumni.fr

      Suis-nous sur les réseaux :
      LinkedIn : https://www.linkedin.com/company/vh-besancon-alumni/
      Instagram : https://www.instagram.com/vh_besancon_alumni/

      ---
      VH Besançon Alumni
      Association loi 1901 • Par des anciens, pour les anciens ET les actuels
      contact@vh-besancon-alumni.fr

      Vous recevez cet email car votre compte a été migré vers le nouveau site.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de l\'email de migration utilisateur:', error)
    return { success: false, error }
  }
}
