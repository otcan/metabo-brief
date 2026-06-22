document.addEventListener("DOMContentLoaded", () => {
  // Smooth scroll
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach(link => {
    link.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Flip card logic
  const cards = document.querySelectorAll(".flip-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      card.classList.toggle("flipped");
    });
  });

  const gdprBanner = document.getElementById("gdpr-banner");
  if (gdprBanner) {
    const consent = window.localStorage.getItem("gdpr-consent");
    if (!consent) {
      gdprBanner.classList.add("is-visible");
    }

    const acceptButton = gdprBanner.querySelector(".gdpr-accept");
    const rejectButton = gdprBanner.querySelector(".gdpr-reject");
    const hideBanner = value => {
      window.localStorage.setItem("gdpr-consent", value);
      gdprBanner.classList.remove("is-visible");
    };

    if (acceptButton) {
      acceptButton.addEventListener("click", () => hideBanner("accepted"));
    }
    if (rejectButton) {
      rejectButton.addEventListener("click", () => hideBanner("rejected"));
    }
  }
});
