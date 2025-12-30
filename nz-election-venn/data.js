// Party colors
const partyColors = {
    national: '#00529F',
    labour: '#D82C20',
    green: '#098137',
    act: '#FDE047',
    nzfirst: '#1E1E1E'
};

// Policy areas with party positions
const commonGround = {
    'all-parties': {
        id: 'all-parties',
        title: "All Major Parties Agree",
        subtitle: "",
        policies: [
            "Housing affordability is a crisis needing action",
            "Healthcare system needs improvement",
            "Cost of living must be addressed",
            "Infrastructure investment needed",
            "Support for KiwiSaver (though contribution rates differ)"
        ],
        color: '#6B7280'
    },
    'right-bloc': {
        id: 'right-bloc',
        title: "National + ACT + NZ First",
        subtitle: "Current Coalition",
        policies: [
            "Reduce government spending",
            "Tougher law and order policies",
            "Gang legislation and harsher sentences",
            "RMA reform to enable development",
            "Cut regulations on business"
        ],
        color: '#4B5563'
    },
    'left-bloc': {
        id: 'left-bloc',
        title: "Labour + Greens",
        subtitle: "Potential Coalition",
        policies: [
            "Wealth/capital gains tax reform",
            "Stronger worker protections & pay equity",
            "More public health investment",
            "Climate action priority",
            "Oppose Fast-track Approvals Act"
        ],
        color: '#DC2626'
    },
    'national-labour': {
        id: 'national-labour',
        title: "National + Labour",
        subtitle: "Centrist Overlap",
        policies: [
            "Continue infrastructure projects regardless of who started them",
            "Policy continuity to avoid economic disruption",
            "Free trade agreements (incl. India FTA)",
            "Moderate approach to Treaty/Māori policy",
            "Support public healthcare system"
        ],
        color: '#7C3AED'
    },
    'national-nzfirst': {
        id: 'national-nzfirst',
        title: "National + NZ First",
        subtitle: "Conservative Alliance",
        policies: [
            "Keep superannuation age at 65",
            "Regional infrastructure investment",
            "Defence spending increase",
            "English language priority in govt",
            "Oppose extreme Treaty reinterpretation"
        ],
        color: '#0369A1'
    },
    'act-green': {
        id: 'act-green',
        title: "ACT + Greens",
        subtitle: "Unlikely but Real",
        policies: [
            "Personal freedoms (End of Life Choice passed with support from both)",
            "Drug law reform discussions",
            "Electoral/democratic reform interests",
            "Civil liberties focus"
        ],
        color: '#65A30D'
    }
};

// Individual party policies
const partyPolicies = {
    national: {
        name: "National",
        leader: "Christopher Luxon",
        unique: [
            "Increase KiwiSaver to 6% by 2032",
            "Local government amalgamation",
            "Standardised primary school testing",
            "Possible superannuation age increase (future)",
            "Asset sales consideration (future)"
        ]
    },
    labour: {
        name: "Labour",
        leader: "Chris Hipkins",
        unique: [
            "NZ Future Fund for innovation",
            "Capital gains tax on investment property",
            "Free GP visits",
            "Cervical cancer screening",
            "Repeal Regulatory Standards Act"
        ]
    },
    green: {
        name: "Green Party",
        leader: "Chlöe Swarbrick & Marama Davidson",
        unique: [
            "$8B Green Budget over 4 years",
            "Ministry of Green Works",
            "Wealth tax & private jet tax",
            "Revoke Fast-track mining consents",
            "Higher corporate & income taxes"
        ]
    },
    act: {
        name: "ACT",
        leader: "David Seymour",
        unique: [
            "Treaty Principles referendum/bill",
            "Aggressive spending cuts",
            "Charter schools expansion",
            "Deregulation priority",
            "Privatisation agenda"
        ]
    },
    nzfirst: {
        name: "NZ First",
        leader: "Winston Peters",
        unique: [
            "10% KiwiSaver contribution",
            "Repeal Regulatory Standards Act",
            "Migrant values statement",
            "English as official language",
            "Workers' party positioning"
        ]
    }
};
