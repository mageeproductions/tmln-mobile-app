import { Instagram } from 'lucide-react';
import { useState } from 'react';
import Modal from './Modal';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/icon.png"
                alt="TMLN"
                className="w-10 h-10 rounded-lg"
              />
              <span className="text-2xl font-bold tracking-wide">TMLN</span>
            </div>
            <p className="text-gray-400">
              Plan unforgettable events with seamless collaboration and smart organization.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button
                  onClick={() => setShowPrivacyModal(true)}
                  className="hover:text-purple-400 transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="hover:text-purple-400 transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="hover:text-purple-400 transition-colors"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <a
                  href="/dashboard"
                  className="hover:text-purple-400 transition-colors"
                >
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/tmln.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg glass-effect hover:bg-white/10 transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center text-gray-400 text-sm">
          <p>&copy; {currentYear} TMLN. All rights reserved.</p>
        </div>
      </div>

      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
      >
        <div className="text-gray-300 space-y-6">
          <p className="text-sm text-gray-400">Last updated: 15 December 2025</p>

          <p>
            TMLN ("we," "our," or "us") respects your privacy and is committed to protecting it through this Privacy Policy. This policy explains how we collect, use, disclose, and safeguard your information when you use the TMLN application, website, and related services (collectively, the "Service").
          </p>

          <div>
            <h3 className="text-lg font-semibold mb-3">1. Information We Collect</h3>

            <h4 className="font-semibold mb-2">Information You Provide</h4>
            <p className="mb-2">We may collect personal information you voluntarily provide, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Name</li>
              <li>Email address</li>
              <li>Event details (dates, locations, timelines)</li>
              <li>Contact information for vendors or collaborators</li>
              <li>Messages, notes, files, or content you upload</li>
            </ul>

            <h4 className="font-semibold mb-2">Automatically Collected Information</h4>
            <p className="mb-2">When you use the Service, we may automatically collect:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Device and browser information</li>
              <li>IP address</li>
              <li>Usage data (pages visited, features used, timestamps)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">2. How We Use Your Information</h3>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide and maintain the Service</li>
              <li>Create and manage your account</li>
              <li>Enable collaboration between users</li>
              <li>Improve features and user experience</li>
              <li>Communicate updates, product changes, or support messages</li>
              <li>Monitor and analyze usage and trends</li>
              <li>Maintain security and prevent misuse</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">3. Sharing Your Information</h3>
            <p className="mb-2">We do not sell your personal data.</p>
            <p className="mb-2">We may share information:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>With service providers who help operate the app (e.g., hosting, analytics)</li>
              <li>With collaborators you explicitly invite into an event</li>
              <li>To comply with legal obligations or protect rights and safety</li>
              <li>In connection with a business transfer (merger, acquisition, etc.)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">4. Data Storage & Security</h3>
            <p>
              We implement reasonable technical and organizational measures to protect your data. However, no system can be guaranteed 100% secure, and you use the Service at your own risk.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">5. Your Rights & Choices</h3>
            <p className="mb-2">Depending on your location, you may have rights to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
              <li>Access, update, or delete your personal data</li>
              <li>Opt out of marketing communications</li>
              <li>Request data portability</li>
            </ul>
            <p>
              You can make these requests by contacting us at:<br />
              📧 [Insert Support Email]
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">6. Cookies & Tracking Technologies</h3>
            <p>
              We use cookies and similar technologies to improve functionality and understand usage. You can control cookie preferences through your browser settings.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">7. Children's Privacy</h3>
            <p>
              TMLN is not intended for users under the age of 13. We do not knowingly collect personal information from children.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">8. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. Updates will be posted with a revised "Last updated" date.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">9. Contact Us</h3>
            <p>
              If you have questions about this Privacy Policy, contact us at:<br />
              📧 hello@tmlnapp.com
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms of Service"
      >
        <div className="text-gray-300 space-y-6">
          <p className="text-sm text-gray-400">Last updated: 15 December 2025</p>

          <p>
            These Terms of Service ("Terms") govern your access to and use of TMLN's application, website, and services (the "Service"). By accessing or using TMLN, you agree to be bound by these Terms.
          </p>

          <div>
            <h3 className="text-lg font-semibold mb-3">1. Eligibility</h3>
            <p>
              You must be at least 18 years old to use the Service. By using TMLN, you represent that you meet this requirement.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">2. Accounts</h3>
            <p className="mb-2">You are responsible for:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
              <li>Maintaining the confidentiality of your account</li>
              <li>All activity that occurs under your account</li>
              <li>Providing accurate and up-to-date information</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">3. Use of the Service</h3>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use the Service for unlawful purposes</li>
              <li>Upload harmful, abusive, or infringing content</li>
              <li>Attempt to access systems without authorization</li>
              <li>Interfere with or disrupt the Service</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">4. Content Ownership</h3>

            <h4 className="font-semibold mb-2">Your Content</h4>
            <p className="mb-4">
              You retain ownership of content you upload. By using the Service, you grant TMLN a limited license to host, store, and display your content solely to operate the Service.
            </p>

            <h4 className="font-semibold mb-2">Our Content</h4>
            <p>
              All software, branding, design, and features are owned by TMLN and protected by intellectual property laws.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">5. Collaboration & Shared Data</h3>
            <p className="mb-2">When you invite others to collaborate on an event, you acknowledge that:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Shared data may be visible to those collaborators</li>
              <li>You are responsible for whom you grant access</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">6. Termination</h3>
            <p className="mb-2">
              We may suspend or terminate access at any time for violations of these Terms or to protect the integrity of the Service.
            </p>
            <p>You may stop using the Service at any time.</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">7. Disclaimer of Warranties</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>The Service is provided "as is" and "as available."</li>
              <li>We make no warranties regarding availability, accuracy, or reliability.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">8. Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by law, TMLN shall not be liable for indirect, incidental, or consequential damages arising from your use of the Service.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">9. Indemnification</h3>
            <p>
              You agree to indemnify and hold harmless TMLN from any claims arising out of your use of the Service or violation of these Terms.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">10. Governing Law</h3>
            <p>
              These Terms shall be governed by and interpreted in accordance with the laws of the State of Nevada, United States, without regard to conflict-of-law principles.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">11. Changes to These Terms</h3>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">12. Contact Information</h3>
            <p>
              Questions about these Terms?<br />
              📧 hello@tmlnapp.com
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Contact Us"
      >
        <div className="text-gray-300">
          <p>
            Have a question? Feel free to reach out any time to{' '}
            <a href="mailto:hello@tmlnapp.com" className="text-blue-400 hover:text-blue-300 underline">
              hello@tmlnapp.com
            </a>{' '}
            and we'll get back to you as soon as we can.
          </p>
        </div>
      </Modal>
    </footer>
  );
}
