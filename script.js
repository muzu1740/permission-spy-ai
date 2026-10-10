
"use strict";

/* ============================================
   PERMISSION SPY AI
   Permission Risk + Smart Policy Scanner
   Local rule-based prototype
   ============================================ */


/* ---------- 1. PERMISSION DATABASE ---------- */

const permissionData = {
    location: {
        name: "Location",
        risk: 12,
        explanation: "Location access may reveal where a device is, including home, work and travel patterns.",
        advice: "Allow location only when necessary. Prefer approximate location or while-in-use access."
    },
    backgroundLocation: {
        name: "Background location",
        risk: 20,
        explanation: "Background location may allow location collection when the app is not actively being used.",
        advice: "Review whether continuous location access is necessary. Disable background access if not needed."
    },
    camera: {
        name: "Camera",
        risk: 12,
        explanation: "Camera access can allow the app to capture photos or video when permitted by the operating system.",
        advice: "Grant camera access only when a feature genuinely requires it."
    },
    microphone: {
        name: "Microphone",
        risk: 14,
        explanation: "Microphone access can expose audio when access is granted and the app uses it.",
        advice: "Review microphone access for apps that do not need audio recording or calls."
    },
    contacts: {
        name: "Contacts",
        risk: 15,
        explanation: "Contacts access may expose names, phone numbers, email addresses and other address-book details.",
        advice: "Avoid sharing your entire address book unless the feature genuinely needs it."
    },
    sms: {
        name: "SMS",
        risk: 20,
        explanation: "Depending on the permission, SMS access may expose messages or allow text messages to be sent.",
        advice: "Treat SMS access as sensitive, especially in apps unrelated to messaging."
    },
    photos: {
        name: "Photos & files",
        risk: 10,
        explanation: "Photo and file access may expose stored media or documents depending on its scope.",
        advice: "Prefer a system photo picker or limited media access where available."
    },
    accessibility: {
        name: "Accessibility access",
        risk: 25,
        explanation: "Powerful accessibility services may observe screen content or interact with the interface.",
        advice: "Enable accessibility access only for trusted apps whose assistive purpose requires it."
    }
};


/* ---------- 2. APP PURPOSE RULES ---------- */

const purposePermissions = {
    general: [],
    camera: ["camera", "photos"],
    social: ["camera", "microphone", "photos", "contacts"],
    navigation: ["location", "backgroundLocation"],
    banking: [],
    accessibility: ["accessibility"]
};


/* ---------- 3. ELEMENT HELPERS ---------- */

function getElement(...ids) {
    for (const id of ids) {
        const element = document.getElementById(id);
        if (element) return element;
    }
    return null;
}

function setText(element, text) {
    if (element) element.textContent = text;
}

function addTextElement(parent, tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;

    if (className) element.className = className;

    parent.appendChild(element);
    return element;
}


/* ---------- 4. PERMISSION INPUTS ---------- */

const permissionCheckboxes = Array.from(
    document.querySelectorAll(
        '.permission-card input[type="checkbox"], ' +
        '.permission-option input[type="checkbox"], ' +
        'input.permission-checkbox'
    )
).filter(input =>
    Object.prototype.hasOwnProperty.call(permissionData, input.value)
);

const selectedCountElement = getElement("selectedCount");
const analyzeButton = getElement("analyzeBtn", "analyzePermissionsBtn");
const resultsSection = getElement("results");


function getSelectedPermissions() {
    return permissionCheckboxes
        .filter(input => input.checked)
        .map(input => input.value);
}


function updateSelectedCount() {
    const count = getSelectedPermissions().length;

    if (selectedCountElement) {
        selectedCountElement.textContent =
            `${count} selected`;
    }
}


permissionCheckboxes.forEach(input => {
    input.addEventListener("change", updateSelectedCount);
});


/* ---------- 5. PERMISSION RISK ENGINE ---------- */

function assessPermissionRisk(selected, purpose) {
    let score = selected.reduce(
        (total, key) => total + permissionData[key].risk,
        0
    );

    const flags = [];
    const has = key => selected.includes(key);

    if (has("location") && has("backgroundLocation")) {
        score += 8;
        flags.push(
            "Location and background location are selected together. " +
            "Review whether continuous tracking is necessary."
        );
    }

    if (has("camera") && has("microphone")) {
        score += 7;
        flags.push(
            "Camera and microphone together can expose visual and audio information. " +
            "Check whether both permissions are needed."
        );
    }

    if (has("contacts") && has("sms")) {
        score += 8;
        flags.push(
            "Contacts and SMS together may expose social connections and message-related data."
        );
    }

    if (has("accessibility") && has("sms")) {
        score += 10;
        flags.push(
            "Accessibility and SMS access form a sensitive combination. " +
            "Verify the app's purpose and whether both permissions are essential."
        );
    }

    const expected = purposePermissions[purpose] || [];

    const unexpected = purpose === "general"
        ? []
        : selected.filter(key => !expected.includes(key));

    if (unexpected.length) {
        flags.push(
            "Some selected permissions are outside this prototype's basic expected list " +
            "for the chosen app purpose. This is a prompt for review, not proof of abuse."
        );
    }

    score = Math.min(100, score);

    let level;
    let description;

    if (score >= 60) {
        level = "High";
        description =
            "Several sensitive permissions or combinations deserve careful review.";
    } else if (score >= 30) {
        level = "Moderate";
        description =
            "Some permissions may expose personal information. Review whether each is necessary.";
    } else {
        level = "Lower";
        description =
            "The selected permissions receive a lower score under these demo rules. " +
            "This does not guarantee that the app is safe.";
    }

    return { score, level, description, flags, unexpected };
}


/* ---------- 6. PERMISSION ANALYSIS ---------- */

function analyzePermissions() {
    const appNameInput = getElement("appName", "applicationName");
    const purposeInput = getElement("appPurpose", "appCategory");

    const appName = appNameInput?.value.trim();
    const purpose = purposeInput?.value || "general";
    const selected = getSelectedPermissions();

    if (!appName) {
        alert("Please enter an application name.");
        appNameInput?.focus();
        return;
    }

    if (!selected.length) {
        alert("Please select at least one permission.");
        return;
    }

    const reportTitle = getElement("reportTitle");
    const reportSubtitle = getElement("reportSubtitle");
    const riskScore = getElement("riskScore");
    const riskTitle = getElement("riskTitle");
    const riskDescription = getElement("riskDescription");
    const riskBadge = getElement("riskBadge");
    const scoreCircle = getElement("scoreCircle");
    const permissionResults = getElement("permissionResults");
    const recommendations = getElement("recommendations");

    if (!resultsSection || !riskScore || !permissionResults || !recommendations) {
        alert(
            "Some permission report elements are missing in index.html. " +
            "Please check the IDs listed in the setup instructions."
        );
        return;
    }

    const result = assessPermissionRisk(selected, purpose);

    setText(reportTitle, `${appName} — Privacy Report`);
    setText(
        reportSubtitle,
        `${selected.length} permission(s) reviewed using local demo rules.`
    );
    setText(riskScore, result.score);
    setText(riskTitle, `${result.level} estimated permission risk`);
    setText(riskDescription, result.description);
    setText(riskBadge, `${result.level.toUpperCase()} RISK`);

    const scoreColors = {
        Lower: "#72d6bd",
        Moderate: "#f2c46d",
        High: "#ff7f86"
    };

    if (scoreCircle) {
        scoreCircle.style.setProperty(
            "--score-color",
            scoreColors[result.level]
        );
    }

    permissionResults.replaceChildren();

    selected.forEach(key => {
        const item = permissionData[key];
        const card = document.createElement("article");
        card.className = "permission-result";

        addTextElement(card, "h4", item.name);
        addTextElement(card, "p", item.explanation);
        addTextElement(card, "p", `Recommendation: ${item.advice}`);

        if (result.unexpected.includes(key)) {
            addTextElement(
                card,
                "span",
                "Review against app purpose",
                "result-tag"
            );
        }

        permissionResults.appendChild(card);
    });

    recommendations.replaceChildren();

    const adviceItems = new Set();

    selected.forEach(key => {
        adviceItems.add(permissionData[key].advice);
    });

    result.flags.forEach(flag => adviceItems.add(flag));

    adviceItems.add(
        "Review the developer identity and privacy policy before trusting an app."
    );

    adviceItems.add(
        "Revoke permissions you do not need through your device's settings."
    );

    adviceItems.forEach(advice => {
        addTextElement(recommendations, "li", advice);
    });

    resultsSection.hidden = false;

    resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


if (analyzeButton) {
    analyzeButton.addEventListener("click", analyzePermissions);
}


/* ---------- 7. RESET PERMISSION ANALYZER ---------- */

const resetButton = getElement("resetBtn", "resetButton");

if (resetButton) {
    resetButton.addEventListener("click", () => {
        permissionCheckboxes.forEach(input => {
            input.checked = false;
        });

        const appNameInput = getElement("appName", "applicationName");
        const purposeInput = getElement("appPurpose", "appCategory");

        if (appNameInput) appNameInput.value = "";
        if (purposeInput) purposeInput.value = "general";

        updateSelectedCount();

        if (resultsSection) {
            resultsSection.hidden = true;
        }
    });
}


/* ============================================
   8. SMART POLICY CLASSIFICATION ENGINE
   ============================================ */

function classifyPolicySentence(sentence) {
    const text = sentence.toLowerCase();

    const protectivePatterns = [
        {
            terms: [
                "do not sell your personal information",
                "we do not sell personal data",
                "will not share your data",
                "will not share your personal information"
            ],
            category: "Data-sharing limitation",
            level: "Protective statement mentioned",
            advice:
                "Check the scope of this statement and any exceptions described elsewhere in the policy."
        },
        {
            terms: [
                "withdraw your consent",
                "manage your preferences",
                "you can opt out",
                "opt out of",
                "request deletion",
                "delete your account"
            ],
            category: "User control",
            level: "Protective measure mentioned",
            advice:
                "Check how to exercise this choice and whether it applies to all relevant data processing."
        },
        {
            terms: [
                "use encryption",
                "encrypted in transit",
                "encrypted at rest",
                "encryption protects",
                "we encrypt"
            ],
            category: "Security measure",
            level: "Protective measure mentioned",
            advice:
                "Review what data is encrypted and the scope of protection. Mentioning encryption does not prove security."
        },
        {
            terms: [
                "we do not collect",
                "we never collect",
                "does not collect personal data",
                "do not collect personal information"
            ],
            category: "Data-collection limitation",
            level: "Protective statement mentioned",
            advice:
                "Check which data categories this statement covers and whether other parts of the policy add exceptions."
        }
    ];

    const concernPatterns = [
        {
            terms: [
                "third-party advertising",
                "advertising partners",
                "share your information",
                "share personal data",
                "share your personal information",
                "sell your personal information",
                "sell personal data",
                "disclose your information"
            ],
            category: "Data sharing",
            level: "Privacy concern to review",
            advice:
                "Check who receives the data, the purpose of sharing, and whether you can opt out."
        },
        {
            terms: [
                "precise location",
                "background location",
                "track your location",
                "location data",
                "gps location",
                "location information"
            ],
            category: "Sensitive location data",
            level: "Privacy concern to review",
            advice:
                "Check whether location collection is necessary, when it occurs, and whether access can be limited."
        },
        {
            terms: [
                "collect personal information",
                "collect personal data",
                "collect your contacts",
                "collects your messages",
                "collect your location",
                "we collect your",
                "we may collect"
            ],
            category: "Personal data collection",
            level: "Privacy concern to review",
            advice:
                "Identify the specific data collected, its purpose, and how long it is retained."
        },
        {
            terms: [
                "tracking technologies",
                "targeted advertising",
                "personalized ads",
                "advertising identifiers",
                "track your activity"
            ],
            category: "Tracking and advertising",
            level: "Privacy concern to review",
            advice:
                "Review tracking settings and any available advertising opt-out."
        },
        {
            terms: [
                "retain personal information indefinitely",
                "retain your data indefinitely",
                "without any time limit",
                "retain your data forever"
            ],
            category: "Data retention",
            level: "Privacy concern to review",
            advice:
                "Check whether the policy explains a justified retention period and deletion process."
        }
    ];

    // Prefer an explicit protective statement where the wording matches it.
    const protective = protectivePatterns.find(pattern =>
        pattern.terms.some(term => text.includes(term))
    );

    if (protective) return protective;

    const concern = concernPatterns.find(pattern =>
        pattern.terms.some(term => text.includes(term))
    );

    if (concern) return concern;

    return {
        category: "General information",
        level: "Informational",
        advice:
            "Read this statement in context. No configured concern or protective phrase was identified."
    };
}


/* ---------- 9. POLICY SCANNER TOPICS ---------- */

const policyChecks = [
    {
        title: "Location data",
        terms: [
            "location data",
            "geolocation",
            "gps location",
            "precise location",
            "location information",
            "track your location"
        ],
        advice:
            "Review when location is collected and whether background access is necessary."
    },
    {
        title: "Personal data collection",
        terms: [
            "personal information",
            "personal data",
            "collect your data",
            "collects information",
            "information we collect",
            "we may collect"
        ],
        advice:
            "Review what information is collected and why it is needed."
    },
    {
        title: "Third-party sharing",
        terms: [
            "third parties",
            "third-party",
            "share your information",
            "data partners",
            "advertising partners",
            "disclose your information"
        ],
        advice:
            "Review who receives the data, why it is shared, and whether you can opt out."
    },
    {
        title: "Tracking and advertising",
        terms: [
            "tracking technologies",
            "targeted advertising",
            "advertising identifiers",
            "personalized ads",
            "cookies and similar technologies",
            "track your activity"
        ],
        advice:
            "Review tracking controls and available advertising opt-out choices."
    },
    {
        title: "Data retention and deletion",
        terms: [
            "retain your data",
            "retention period",
            "retain personal information",
            "delete your data",
            "data deletion",
            "delete your account",
            "retain personal information"
        ],
        advice:
            "Look for retention periods and ways to request deletion."
    },
    {
        title: "Security practices",
        terms: [
            "encryption",
            "security measures",
            "protect your information",
            "security safeguards",
            "unauthorized access",
            "we encrypt"
        ],
        advice:
            "Review the specific safeguards described. A security statement alone does not prove data is secure."
    },
    {
        title: "Consent and user choices",
        terms: [
            "your consent",
            "give your consent",
            "withdraw your consent",
            "opt out",
            "manage your preferences",
            "request deletion"
        ],
        advice:
            "Check how consent is obtained, withdrawn, and managed."
    }
];


/* ---------- 10. POLICY RESULT CARDS ---------- */

function createPolicyFinding(title, advice, matches) {
    const card = document.createElement("article");
    card.className = "policy-finding";

    addTextElement(card, "h4", title);
    addTextElement(card, "p", advice);

    if (matches.length) {
        addTextElement(
            card,
            "p",
            "Matching sentence(s) from the supplied policy:"
        );

        matches.forEach(sentence => {
            const classification = classifyPolicySentence(sentence);

            const evidence = document.createElement("div");
            evidence.className = "policy-evidence";

            const quote = addTextElement(
                evidence,
                "blockquote",
                `“${sentence}”`
            );

            quote.className = "evidence-quote";

            const label = addTextElement(
                evidence,
                "p",
                `${classification.level} · ${classification.category}`,
                "classification-label"
            );

            if (
                classification.level === "Privacy concern to review"
            ) {
                label.classList.add("classification-concern");
            } else if (
                classification.level.includes("Protective")
            ) {
                label.classList.add("classification-protective");
            } else {
                label.classList.add("classification-informational");
            }

            addTextElement(
                evidence,
                "p",
                classification.advice,
                "classification-advice"
            );

            card.appendChild(evidence);
        });
    } else {
        addTextElement(
            card,
            "p",
            "No configured keyword was found. The policy may discuss this topic using different wording."
        );
    }

    return card;
}


/* ---------- 11. ANALYZE PRIVACY POLICY ---------- */

function analyzePrivacyPolicy() {
    const policyInput = getElement("policyText");
    const output = getElement("policyResults");

    if (!policyInput || !output) {
        alert("Privacy policy scanner fields are missing in index.html.");
        return;
    }

    const text = policyInput.value.trim();
    output.replaceChildren();

    if (text.length < 40) {
        output.textContent =
            "Please paste a longer privacy policy before analyzing.";
        return;
    }

    const sentences = text
        .replace(/\s+/g, " ")
        .match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];

    const cleanSentences = sentences
        .map(sentence => sentence.trim())
        .filter(Boolean);

    const normalized = cleanSentences.map(sentence => ({
        original: sentence,
        lower: sentence.toLowerCase()
    }));

    let matchedTopics = 0;
    let concernCount = 0;
    let protectiveCount = 0;
    let informationalCount = 0;

    const heading = addTextElement(
        output,
        "h3",
        "Smart Privacy Policy Findings"
    );

    heading.className = "policy-results-heading";

    policyChecks.forEach(check => {
        const matches = normalized
            .filter(sentence =>
                check.terms.some(term => sentence.lower.includes(term))
            )
            .map(sentence => sentence.original);

        if (matches.length) matchedTopics++;

        matches.forEach(sentence => {
            const result = classifyPolicySentence(sentence);

            if (result.level === "Privacy concern to review") {
                concernCount++;
            } else if (result.level.includes("Protective")) {
                protectiveCount++;
            } else {
                informationalCount++;
            }
        });

        const card = createPolicyFinding(
            (matches.length ? "Evidence found: " : "No keyword evidence: ") +
                check.title,
            check.advice,
            matches
        );

        output.appendChild(card);
    });

    const summary = document.createElement("div");
    summary.className = "policy-summary";

    addTextElement(
        summary,
        "h3",
        "Analysis Summary"
    );

    addTextElement(
        summary,
        "p",
        `${matchedTopics} of ${policyChecks.length} topics matched configured keywords.`
    );

    addTextElement(
        summary,
        "p",
        `Sentence classifications: ${concernCount} concern(s) to review, ` +
        `${protectiveCount} protective statement(s), and ` +
        `${informationalCount} informational statement(s).`
    );

    addTextElement(
        summary,
        "p",
        "These are rule-based preliminary classifications. A sentence may match more than one topic. " +
        "A protective statement does not prove security, and a flagged statement does not prove wrongdoing."
    );

    output.prepend(summary);
}


const policyButton = getElement("analyzePolicyBtn");

if (policyButton) {
    policyButton.addEventListener("click", analyzePrivacyPolicy);
}


/* ---------- 12. INITIALIZE ---------- */

updateSelectedCount();

console.log("Permission Spy AI initialized successfully.");
