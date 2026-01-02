// Policy questions and party positions for NZ 2026 Election
// Based on announced policies and party positions (Dec 2024-2025)

const partyInfo = {
    national: {
        name: "National",
        leader: "Christopher Luxon",
        color: "#00529F"
    },
    labour: {
        name: "Labour",
        leader: "Chris Hipkins",
        color: "#D82C20"
    },
    greens: {
        name: "Green Party",
        leaders: "Chlöe Swarbrick & Marama Davidson",
        color: "#098137"
    },
    act: {
        name: "ACT",
        leader: "David Seymour",
        color: "#FDE047",
        textColor: "#000000"
    },
    nzfirst: {
        name: "NZ First",
        leader: "Winston Peters",
        color: "#1E1E1E"
    }
};

// Policy questions
// Position values: 1 = strongly agree, 0.5 = somewhat agree, 0 = neutral, -0.5 = somewhat disagree, -1 = strongly disagree
const policyQuestions = [
    {
        id: 1,
        category: "Tax & Economy",
        question: "New Zealand should introduce a wealth tax on high-value assets",
        positions: {
            national: -1,
            labour: 0.5,    // Capital gains tax on investment property
            greens: 1,      // Wealth tax & private jet tax
            act: -1,
            nzfirst: -0.5
        }
    },
    {
        id: 2,
        category: "Tax & Economy",
        question: "The government should reduce overall spending and cut back on services",
        positions: {
            national: 0.5,
            labour: -1,
            greens: -1,
            act: 1,         // Aggressive spending cuts
            nzfirst: -0.5
        }
    },
    {
        id: 3,
        category: "Retirement",
        question: "KiwiSaver contributions should be increased to 10%",
        positions: {
            national: -0.5,  // 6% by 2032
            labour: -0.5,
            greens: 0,
            act: -1,
            nzfirst: 1       // 10% KiwiSaver
        }
    },
    {
        id: 4,
        category: "Healthcare",
        question: "GP visits should be free for all New Zealanders",
        positions: {
            national: -0.5,
            labour: 1,       // Free GP visits
            greens: 1,
            act: -1,
            nzfirst: 0.5
        }
    },
    {
        id: 5,
        category: "Environment",
        question: "Fast-track resource consent approvals should continue to enable development",
        positions: {
            national: 1,
            labour: -1,      // Oppose Fast-track
            greens: -1,      // Revoke Fast-track mining
            act: 1,
            nzfirst: 0.5
        }
    },
    {
        id: 6,
        category: "Environment",
        question: "Climate action should be a top priority, even if it slows economic growth",
        positions: {
            national: -0.5,
            labour: 0.5,     // Climate action priority
            greens: 1,       // $8B Green Budget
            act: -1,
            nzfirst: -0.5
        }
    },
    {
        id: 7,
        category: "Treaty & Te Tiriti",
        question: "There should be a referendum on Treaty of Waitangi principles",
        positions: {
            national: 0.5,   // Supports coalition partner ACT on this
            labour: -1,
            greens: -1,
            act: 1,          // Treaty Principles bill/referendum
            nzfirst: 0.5
        }
    },
    {
        id: 8,
        category: "Law & Order",
        question: "Gang legislation and harsher sentences are needed to reduce crime",
        positions: {
            national: 1,
            labour: -0.5,
            greens: -1,
            act: 1,
            nzfirst: 1
        }
    },
    {
        id: 9,
        category: "Education",
        question: "Charter schools should be expanded across New Zealand",
        positions: {
            national: 0.5,
            labour: -1,
            greens: -1,
            act: 1,          // Charter schools expansion
            nzfirst: 0
        }
    },
    {
        id: 10,
        category: "Housing",
        question: "The government should directly build more state houses",
        positions: {
            national: -0.5,
            labour: 1,
            greens: 1,
            act: -1,
            nzfirst: 0.5
        }
    },
    {
        id: 11,
        category: "Immigration",
        question: "Immigration levels should be significantly reduced",
        positions: {
            national: -0.5,
            labour: 0,
            greens: -0.5,
            act: 0,
            nzfirst: 1       // Migrant values statement, workers' party
        }
    },
    {
        id: 12,
        category: "Workers' Rights",
        question: "Worker protections and pay equity laws should be strengthened",
        positions: {
            national: -0.5,
            labour: 1,       // Stronger worker protections
            greens: 1,
            act: -1,         // Deregulation priority
            nzfirst: 0.5     // Workers' party positioning
        }
    },
    {
        id: 13,
        category: "Privatisation",
        question: "Some government services should be privatised to improve efficiency",
        positions: {
            national: 0.5,   // Asset sales consideration
            labour: -1,
            greens: -1,
            act: 1,          // Privatisation agenda
            nzfirst: -0.5
        }
    },
    {
        id: 14,
        category: "Local Government",
        question: "Local councils should be amalgamated to reduce duplication",
        positions: {
            national: 1,     // Local government amalgamation
            labour: -0.5,
            greens: -0.5,
            act: 0.5,
            nzfirst: 0
        }
    },
    {
        id: 15,
        category: "Regional Development",
        question: "More investment should go to regional infrastructure and development",
        positions: {
            national: 0.5,
            labour: 0.5,     // Infrastructure investment
            greens: 0.5,
            act: -0.5,
            nzfirst: 1       // Regional infrastructure investment
        }
    }
];
