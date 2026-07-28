import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export function NexusContact({
  email,
  phone,
  location,
}: {
  email: string;
  phone: string;
  location: string;
}) {
  return (
    <div className="nexus-contact" id="contact">
      <div className="nexus-section-header">
        <div className="nexus-section-icon"><Send className="w-5 h-5" /></div>
        <h2 className="nexus-section-title">Get In Touch</h2>
      </div>
      <div className="nexus-contact-grid">
        <motion.div
          className="nexus-contact-info"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="nexus-contact-text">
            Have a project in mind or want to collaborate? Feel free to reach out.
            I'm always open to discussing new opportunities and ideas.
          </p>
          <div className="nexus-contact-channels">
            {email && (
              <a href={`mailto:${email}`} className="nexus-contact-channel">
                <div className="nexus-contact-channel-icon"><Mail className="w-5 h-5" /></div>
                <div>
                  <p className="nexus-contact-channel-label">Email</p>
                  <p className="nexus-contact-channel-value">{email}</p>
                </div>
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`} className="nexus-contact-channel">
                <div className="nexus-contact-channel-icon"><Phone className="w-5 h-5" /></div>
                <div>
                  <p className="nexus-contact-channel-label">Phone</p>
                  <p className="nexus-contact-channel-value">{phone}</p>
                </div>
              </a>
            )}
            {location && (
              <div className="nexus-contact-channel">
                <div className="nexus-contact-channel-icon"><MapPin className="w-5 h-5" /></div>
                <div>
                  <p className="nexus-contact-channel-label">Location</p>
                  <p className="nexus-contact-channel-value">{location}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="nexus-contact-form-wrap"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <form className="nexus-contact-form" onSubmit={(e) => { e.preventDefault(); window.location.href = `mailto:${email}?subject=Portfolio Inquiry`; }}>
            <input className="nexus-input" placeholder="Your Name" required />
            <input className="nexus-input" type="email" placeholder="Your Email" required />
            <textarea className="nexus-textarea" placeholder="Your Message" rows={4} required />
            <button className="nexus-btn-primary" type="submit">
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
