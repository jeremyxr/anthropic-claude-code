# Clinical Assistant MVP - Implementation Plan

## Executive Summary

Build a HIPAA-compliant AI clinical consultation tool that helps therapists explore alternative therapeutic frameworks and challenges their clinical thinking. This MVP focuses on the core consultation feature with manual session notes (no transcript integration) to enable delivery within 4-6 weeks while maintaining full HIPAA compliance.

## Problem Statement

Therapists need a consultation tool to explore alternative frameworks and strategies between sessions. Current solutions (ChatGPT) are not HIPAA compliant and tend to validate rather than challenge clinical thinking. This tool will act as a "clinical supervisor" that asks probing questions and suggests alternative perspectives.

## Core MVP Features (4-6 Week Scope)

### Must Have
1. **HIPAA-compliant infrastructure** - Encryption at rest/transit, audit logging, RLS policies
2. **User authentication** - Supabase Auth with MFA enforcement for clinical users
3. **Patient management** - Create/view patients with encrypted PHI
4. **Session notes** - Therapists can create sessions and add encrypted clinical notes
5. **AI consultation** - Thread-based conversations with AI that challenges (not validates) thinking
6. **Challenge mechanism** - AI configured to ask probing questions and suggest alternatives
7. **Audit logging** - All PHI access logged for HIPAA compliance

### Explicitly Out of Scope for MVP
- ❌ AIS transcript integration (added in Phase 2)
- ❌ Supervisor access and oversight features
- ❌ Practice management and team features
- ❌ Analytics dashboard
- ❌ Advanced de-identification (no transcripts yet)
- ❌ Export functionality
- ❌ Mobile app (responsive web only)

## System Architecture

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase PostgreSQL with Row Level Security
- **API**: Next.js API routes + Supabase client
- **Authentication**: Supabase Auth with MFA
- **AI**: Anthropic Claude Opus 4.5 via API
- **Encryption**: Supabase Vault for PHI encryption
- **Hosting**: Vercel (frontend) + Supabase (backend)

### Security Architecture

#### Authentication & Authorization
```typescript
// Clinical user roles (simplified for MVP)
type ClinicalRole = 'therapist' | 'admin';

// All clinical users must:
// - Enable MFA (enforced at signup)
// - Complete HIPAA training checkbox
// - Accept terms acknowledging audit logging
```

#### Encryption Strategy
- **Database-level**: Supabase TDE (Transparent Data Encryption)
- **Column-level**: Supabase Vault for PHI fields (patient names, notes)
- **In-transit**: HTTPS/TLS 1.3 for all API calls
- **Searchable hashing**: SHA-256 hash for patient name lookup

#### Row-Level Security (RLS)
```sql
-- Patients: therapists can only see their own patients
CREATE POLICY "therapist_owns_patient" ON patients
  FOR ALL USING (auth.uid() = therapist_id);

-- Sessions: therapists can only see sessions for their patients
CREATE POLICY "therapist_owns_sessions" ON therapy_sessions
  FOR ALL USING (
    patient_id IN (
      SELECT id FROM patients WHERE therapist_id = auth.uid()
    )
  );

-- Consultations: therapists see only their own consultations
CREATE POLICY "therapist_owns_consultations" ON consultations
  FOR ALL USING (auth.uid() = therapist_id);
```

#### Audit Logging
Every PHI access automatically logged:
- Who (user_id, email, role)
- What (action, resource_type, resource_id)
- When (timestamp with timezone)
- Where (IP address, user agent)
- Why (optional justification field)

Logs are immutable (append-only) and retained for 7 years.

## Data Models

### Core Tables

#### `therapists`
```sql
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  license_type VARCHAR(50), -- 'LCSW', 'PhD', 'PsyD', etc.
  license_number VARCHAR(100),
  license_state VARCHAR(2),

  -- HIPAA compliance
  mfa_enabled BOOLEAN DEFAULT false NOT NULL,
  hipaa_training_completed BOOLEAN DEFAULT false NOT NULL,
  hipaa_training_date TIMESTAMPTZ,
  terms_accepted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_therapists_user_id ON therapists(user_id);
```

#### `patients` (PHI)
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES therapists(id) NOT NULL,

  -- Encrypted PHI
  encrypted_full_name TEXT NOT NULL, -- AES-256 encrypted via Supabase Vault
  encrypted_date_of_birth TEXT,
  encrypted_medical_record_number TEXT,

  -- Searchable hash for patient lookup
  name_search_hash VARCHAR(64) NOT NULL, -- SHA-256(lowercase(full_name))

  -- Metadata (non-PHI)
  case_status VARCHAR(20) DEFAULT 'active' NOT NULL, -- 'active', 'inactive', 'discharged'
  first_session_date DATE,
  last_session_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ -- soft delete for compliance
);

CREATE INDEX idx_patients_therapist_id ON patients(therapist_id);
CREATE INDEX idx_patients_name_search_hash ON patients(name_search_hash);
CREATE INDEX idx_patients_case_status ON patients(case_status) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
```

#### `therapy_sessions`
```sql
CREATE TABLE therapy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  therapist_id UUID REFERENCES therapists(id) NOT NULL,

  session_date DATE NOT NULL,
  session_number INTEGER NOT NULL, -- auto-increment per patient
  session_type VARCHAR(20) DEFAULT 'individual', -- 'initial', 'individual', 'crisis'
  duration_minutes INTEGER,

  -- Encrypted clinical notes
  encrypted_session_notes TEXT, -- therapist's session notes
  encrypted_clinical_observations TEXT, -- key observations/themes

  -- Metadata
  frameworks_discussed TEXT[], -- e.g., ['CBT', 'DBT']
  session_rating INTEGER CHECK (session_rating BETWEEN 1 AND 5),

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_patient_id ON therapy_sessions(patient_id);
CREATE INDEX idx_sessions_therapist_id ON therapy_sessions(therapist_id);
CREATE INDEX idx_sessions_session_date ON therapy_sessions(session_date DESC);

-- Enable RLS
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
```

#### `consultations`
```sql
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES therapists(id) NOT NULL,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  session_id UUID REFERENCES therapy_sessions(id), -- optional

  title TEXT NOT NULL,
  consultation_type VARCHAR(50) NOT NULL,
  -- 'session_review', 'case_conceptualization', 'intervention_planning', 'ethical_dilemma'

  status VARCHAR(20) DEFAULT 'active' NOT NULL, -- 'active', 'archived'
  message_count INTEGER DEFAULT 0 NOT NULL,
  last_message_at TIMESTAMPTZ,

  -- Context for AI
  frameworks_of_interest TEXT[], -- frameworks therapist wants to explore

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_consultations_therapist_id ON consultations(therapist_id);
CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX idx_consultations_status ON consultations(status);

-- Enable RLS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
```

#### `consultation_messages`
```sql
CREATE TABLE consultation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,

  role VARCHAR(20) NOT NULL, -- 'therapist', 'ai_assistant'
  encrypted_content TEXT NOT NULL, -- encrypted markdown content

  -- AI-specific metadata
  ai_model_version VARCHAR(50), -- e.g., 'claude-opus-4-5'
  ai_challenge_score INTEGER CHECK (ai_challenge_score BETWEEN 0 AND 10),
  ai_cited_frameworks TEXT[],
  ai_suggested_alternatives TEXT[],

  -- Feedback
  therapist_found_helpful BOOLEAN,
  therapist_feedback_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_messages_consultation_id ON consultation_messages(consultation_id);
CREATE INDEX idx_messages_created_at ON consultation_messages(created_at DESC);

-- Enable RLS
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who
  user_id UUID REFERENCES auth.users NOT NULL,
  user_email VARCHAR(255) NOT NULL, -- denormalized for immutability
  therapist_id UUID REFERENCES therapists(id),

  -- What
  action VARCHAR(20) NOT NULL, -- 'view', 'create', 'update', 'delete', 'decrypt'
  resource_type VARCHAR(50) NOT NULL, -- 'patient', 'session', 'consultation', 'message'
  resource_id UUID NOT NULL,

  -- When/Where
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address INET,
  user_agent TEXT,

  -- Context
  access_justification TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Audit logs are append-only (no RLS policies for modification)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapists_view_own_audit_logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());
```

### Database Relationships
```
therapists (1) ─── (M) patients
therapists (1) ─── (M) therapy_sessions
patients (1) ─── (M) therapy_sessions
therapy_sessions (1) ─── (M) consultations (optional FK)
patients (1) ─── (M) consultations
consultations (1) ─── (M) consultation_messages

All tables ───> audit_logs (via triggers)
```

## AI Consultation Framework

### Core Principle: Challenge, Don't Validate

The AI acts as a **Socratic clinical supervisor** that:
- Asks probing questions rather than providing answers
- Detects bias and blind spots (confirmation bias, cultural insensitivity, countertransference)
- Suggests 2-3 alternative therapeutic frameworks/conceptualizations
- Raises ethical concerns and boundary issues
- Cites evidence-based research and diagnostic criteria

### System Prompt Template

```typescript
const CLINICAL_SUPERVISOR_PROMPT = `You are an expert clinical supervisor with deep expertise across multiple therapeutic modalities (CBT, DBT, psychodynamic, humanistic, EMDR, ACT, IFS, etc.). Your role is to challenge the therapist's thinking and help them consider alternative perspectives.

CRITICAL GUIDELINES:

1. CHALLENGE, DON'T VALIDATE
   Your primary role is to help therapists think critically, not to reassure them. Ask probing questions that surface blind spots and assumptions.

2. BIAS DETECTION
   Actively look for:
   - Confirmation bias (only seeing evidence supporting their hypothesis)
   - Cultural blind spots and lack of cultural humility
   - Countertransference issues
   - Diagnostic oversimplification
   - Overgeneralization from limited data

3. ALTERNATIVE FRAMEWORKS
   Always suggest at least 2-3 alternative therapeutic approaches or case conceptualizations, even if the current approach seems sound.

4. SOCRATIC METHOD
   Ask questions more than provide answers. Help therapists discover insights themselves through guided inquiry.

5. ETHICAL CONSIDERATIONS
   Proactively raise ethical concerns, boundary issues, or scope-of-practice questions when relevant.

6. EVIDENCE-BASED
   Cite research findings, diagnostic criteria (DSM-5, ICD-11), and established frameworks when relevant.

7. CULTURAL HUMILITY
   Always consider cultural, racial, socioeconomic, gender, and identity factors that may be overlooked.

RESPONSE STRUCTURE:
- **Questions to Ponder**: 3-5 challenging questions
- **Alternative Perspectives**: 2-3 different ways to conceptualize the case
- **Evidence to Consider**: Relevant research or diagnostic criteria
- **Potential Blind Spots**: What might be missed or overlooked
- **Suggested Next Steps**: Concrete actions for further exploration

NEVER:
- Simply agree with the therapist without critique
- Provide medical diagnoses (defer to psychiatrists)
- Give legal advice
- Make definitive treatment recommendations (guide exploration instead)
- Use overly validating language ("you're doing great", "that's perfect")

Remember: Your job is to make therapists think harder, not to make them feel better.`;
```

### Challenge Scoring

After each AI response, analyze the content to score challenge quality:

```typescript
interface ChallengeAnalysis {
  score: number; // 0-10 (target: 5-8)
  questionCount: number; // target: 3-5
  alternativesCount: number; // target: 2-3
  validationRatio: number; // 0-1 (lower is better, target: <0.2)
  citationCount: number;
}

// Score formula:
score = min(10,
  (questionCount * 0.5) +
  (alternativesCount * 2) +
  (citationCount * 0.3) -
  (validationPhrases * 1.5)
);

// If score < 4, flag for review
// If score > 9, may be too challenging/harsh
```

### Deep Dive: How the Framework Actually Works

This section shows concrete examples of what the AI consultation looks like in practice and how it adapts dynamically.

#### Example 1: Good Challenge vs Bad Validation

**Therapist's Message:**
> "I've been working with a 28-year-old client presenting with anxiety. She's been doing well with CBT techniques - her homework compliance is great and she says the thought records are helpful. I'm thinking we're on the right track and can probably start thinking about termination in a few months."

**❌ BAD RESPONSE (Too Validating - Score: 2/10)**
```
That's wonderful to hear! It sounds like you're doing excellent work with this client. CBT is a great evidence-based approach for anxiety, and the fact that she's compliant with homework is a really positive sign. You should feel proud of the progress you've made together. Continuing with the thought records and planning for termination sounds like a solid plan.
```
**Why this is bad:** Pure validation, no challenge, no alternatives, reinforces therapist's existing view.

**✅ GOOD RESPONSE (Appropriately Challenging - Score: 7/10)**
```
**Questions to Ponder:**

1. What does "doing well" actually mean in this case? How are you measuring improvement beyond homework compliance? Are you tracking objective anxiety measures (GAD-7, subjective distress ratings)?

2. You mention she "says" the thought records are helpful - have you noticed changes in her anxiety-provoking situations outside the therapy room? Sometimes clients can be compliant without real behavioral change.

3. What's driving your instinct to move toward termination? Is it her progress, or could there be countertransference at play (wanting to help her become independent, your own discomfort with dependency)?

4. Have you explored what happens when she stops doing thought records? Is she internalizing the skill, or is she dependent on the structured homework?

**Alternative Perspectives:**

While CBT for anxiety has strong evidence, consider:

- **Relational/Psychodynamic Lens**: What is the anxiety protecting her from? Homework compliance might be a form of "good patient" behavior that mirrors earlier relational patterns. What happens if you explore the anxiety's function rather than just managing symptoms?

- **ACT Framework**: Is she learning to have less anxiety, or learning to have a different relationship with anxiety? CBT focuses on thought modification; ACT would focus on values-based action despite anxiety. Which is the actual goal?

- **Attachment Consideration**: At 28, presenting with anxiety - what's her attachment history? Is the "doing well" a sign of secure progress, or is she performing wellness to please you?

**Potential Blind Spots:**

- **Premature termination**: Research shows relapse rates for anxiety can be high if termination occurs too quickly after symptom reduction. Are you assessing her ability to self-regulate when life stressors increase?

- **Cultural factors**: You haven't mentioned her cultural background. In some cultures, direct expression of emotional distress is discouraged, and homework compliance might mask deeper struggles.

- **Life context**: What's happening in her life? Is this a period of stability that might not represent her typical stressors?

**Evidence to Consider:**

- Studies on CBT for anxiety show symptom reduction often occurs early, but relapse prevention requires longer-term work (Craske et al., 2014)
- The therapeutic relationship predicts outcomes as strongly as specific techniques (Norcross & Lambert, 2018)
- Homework compliance doesn't always correlate with lasting change (Kazantzis et al., 2016)

**Suggested Next Steps:**

1. Administer objective measures (if not already doing so)
2. Explicitly discuss with her what termination means and what anxieties it might bring up
3. Test her skills in more challenging scenarios before terminating
4. Explore the relational dynamics - what does her "good client" behavior represent?
5. Consider a longer tapering period (bi-weekly, monthly check-ins) rather than abrupt termination
```
**Why this is good:**
- 8 probing questions
- 3 alternative frameworks (psychodynamic, ACT, attachment)
- 4 potential blind spots identified
- 3 evidence-based citations
- 5 concrete action items
- Challenges the therapist's assumption without being harsh

#### Example 2: Dynamic Prompt Adjustment

The system prompt evolves based on conversation patterns. Here's how:

**Base System Prompt** (shown earlier in plan)
```
You are an expert clinical supervisor...
```

**+ Dynamic Additions Based on Context**

**If Therapist Shows Overconfidence Signals:**
```typescript
// Detected from message analysis: definitive language, no uncertainty, quick to diagnose
ADDITIONAL_INSTRUCTION = `
IMPORTANT: This therapist is showing high confidence in their assessment.
Your job is to introduce productive doubt:

- Question their diagnostic certainty ("What would change your mind about this diagnosis?")
- Probe for disconfirming evidence ("What symptoms don't fit?")
- Explore alternative explanations ("If this weren't [diagnosis], what else could explain the presentation?")
- Challenge premature closure ("What are you not asking about?")

Be more assertive in your questioning. Don't let confident assertions go unchallenged.
`;
```

**If Therapist Shows Anxiety/Uncertainty:**
```typescript
// Detected from message analysis: hedging language, excessive qualifiers, seeking reassurance
ADDITIONAL_INSTRUCTION = `
IMPORTANT: This therapist seems uncertain and may be seeking reassurance.
DO NOT provide reassurance. Instead:

- Validate the complexity ("This is genuinely difficult to parse")
- Ask what specific data would help them feel more confident
- Encourage them to articulate their own hypothesis before suggesting alternatives
- Help them develop their clinical judgment rather than relying on you

Frame challenges as curiosity, not criticism.
`;
```

**If Discussing Specific Cultural Context:**
```typescript
// Detected from message: mentions race, ethnicity, immigration, cultural factors
ADDITIONAL_INSTRUCTION = `
IMPORTANT: Cultural factors are in play. Center cultural humility:

- Question your own (and the therapist's) cultural assumptions
- Ask about specific cultural values and how they relate to the presenting problem
- Explore whether Western psychological frameworks fit this client's worldview
- Consider whether "symptoms" might be culturally normative responses
- Ask about experiences of discrimination, marginalization, or cultural disconnection

Be especially vigilant about pathologizing cultural differences.
`;
```

**If Ethical Dilemma Flagged:**
```typescript
// Detected from consultation_type = 'ethical_dilemma'
ADDITIONAL_INSTRUCTION = `
IMPORTANT: This is an ethical dilemma. Your role is to:

- Surface all stakeholders and their interests (client, therapist, family, agency, legal system)
- Reference relevant ethics codes (APA, NASW, ACA - depending on therapist's license)
- Explore competing ethical principles (autonomy vs. beneficence, confidentiality vs. duty to warn)
- Ask about consultation resources (supervisor, ethics committee, legal counsel)
- DO NOT provide definitive ethical advice - help them reason through it

This is not the place to be hypothetical. Ground in specific ethical frameworks.
`;
```

#### Example 3: Few-Shot Prompting Strategy

Should we include example exchanges in the system prompt? **Yes, for consistency.** Here's the approach:

**Few-Shot Examples Embedded in System Prompt:**

```typescript
const FEW_SHOT_EXAMPLES = `
Here are examples of the type of challenging supervision you should provide:

EXAMPLE 1:
Therapist: "My client with depression isn't doing their homework. I'm frustrated because I know CBT works if they'd just try it."

Good Supervisor Response:
"I'm hearing frustration that the client isn't following through. Let's examine that:

1. What's your theory about why they're not doing homework? Is it avoidance, lack of skill, or is the homework not matching their actual needs?
2. You said 'I know CBT works if they'd just try it' - where's the locus of control in that statement? Is it on you to make CBT work, or on them to comply?
3. What if their non-compliance is actually the most important clinical data you have right now? What is it telling you about their depression, their relationship with authority, or their readiness for change?
4. Have you considered motivational interviewing principles before diving into CBT techniques? What's their actual goal for therapy?

Alternative perspective: The behavioral activation model (Martell et al.) might suggest that homework non-completion IS depression in action. How might you work with that rather than against it?"

---

EXAMPLE 2:
Therapist: "I'm working with a teenager who's cutting. The parents want me to make her stop, but I'm building rapport and don't want to break trust by focusing too much on the self-harm."

Good Supervisor Response:
"This is a common tension, and I want to challenge your framing:

1. You've set up a false dichotomy: rapport-building vs. addressing self-harm. Why can't addressing the self-harm directly be part of rapport-building? What assumption are you making about what the teen needs from you?
2. What's the function of the cutting? Until you assess that (emotion regulation, self-punishment, communication, etc.), you can't determine whether 'making her stop' is even the right goal.
3. The parents' pressure is important data. How are you managing their anxiety while maintaining appropriate boundaries with the teen? Are you triangulated?
4. Whose discomfort are you avoiding - hers or yours? Be honest: are you worried that addressing it will damage the relationship, or are you uncomfortable with the topic?
5. What does 'building rapport' mean to you? Sometimes the most respectful thing is to name the elephant in the room directly.

Consider DBT's approach: validation AND change. You can build rapport by acknowledging how cutting helps her AND collaboratively exploring what else might help. It's not either/or.

Also: risk assessment. What's your protocol if severity increases? You need a safety plan before you can work on anything else."

---

EXAMPLE 3:
Therapist: "Client shared childhood sexual abuse today. I felt so sad for her and told her how strong she is for surviving that. She seemed to appreciate it."

Good Supervisor Response:
"Let's slow down and examine what happened:

1. What was your emotional response in the moment? You felt sadness - that's natural. But did you process that sadness, or did you act on it immediately by reassuring her?
2. What was the function of telling her she's 'strong'? Was it for her benefit, or to manage your own discomfort with her pain?
3. You say she 'seemed to appreciate it' - how do you know? Could she have been taking care of you by showing appreciation?
4. Trauma survivors often receive messages that they need to be 'strong.' What if she's tired of being strong? What if your validation of strength prevents her from being vulnerable about ongoing struggles?
5. What didn't you say? Did you make space for her to express the full range of feelings - including anger, shame, or ambivalence about the perpetrator?

Alternative approach (trauma-informed lens): Instead of praising strength, you might reflect what you observed: 'That took courage to share' or 'How is it to tell me this?' This puts the focus on the present moment rather than making meaning of her past.

Also consider: Are you trained in trauma work? If this is outside your competency, consultation or referral might be necessary. There's a difference between holding space for a disclosure and doing trauma-focused therapy."
`;

// These examples are prepended to the system prompt to model the desired behavior
const FULL_SYSTEM_PROMPT = CLINICAL_SUPERVISOR_PROMPT + "\n\n" + FEW_SHOT_EXAMPLES;
```

**Why Few-Shot Examples Work:**

1. **Consistency**: Claude learns the specific tone and depth of challenge expected
2. **Calibration**: Shows the line between helpful challenge and harsh criticism
3. **Structure**: Models the "Questions / Alternatives / Blind Spots / Next Steps" format
4. **Edge Cases**: Demonstrates how to handle sensitive topics (suicide, abuse, ethics)

#### Implementation: The Full Prompt Construction

Here's how all pieces come together when generating a response:

```typescript
async function constructFullPrompt(params: {
  consultation: Consultation;
  messages: ConsultationMessage[];
  newMessage: string;
  sessionContext?: SessionContext;
  therapistProfile: TherapistProfile;
}): Promise<{ system: string; messages: Array<{role: string; content: string}> }> {

  // 1. BASE PROMPT
  let systemPrompt = CLINICAL_SUPERVISOR_PROMPT;

  // 2. ADD FEW-SHOT EXAMPLES
  systemPrompt += "\n\n" + FEW_SHOT_EXAMPLES;

  // 3. DYNAMIC ADDITIONS BASED ON CONTEXT

  // Analyze therapist's communication patterns
  const therapistPatterns = analyzeTherapistPatterns(params.messages);

  if (therapistPatterns.overconfidence > 0.7) {
    systemPrompt += "\n\n" + OVERCONFIDENCE_INSTRUCTION;
  }

  if (therapistPatterns.seekingReassurance > 0.6) {
    systemPrompt += "\n\n" + UNCERTAINTY_INSTRUCTION;
  }

  // Check for cultural factors
  if (detectCulturalContext(params.newMessage) || params.sessionContext?.culturalFactors) {
    systemPrompt += "\n\n" + CULTURAL_HUMILITY_INSTRUCTION;
  }

  // Check consultation type
  if (params.consultation.consultation_type === 'ethical_dilemma') {
    systemPrompt += "\n\n" + ETHICAL_DILEMMA_INSTRUCTION;
  }

  // 4. ADD SPECIFIC CONTEXT FROM CONSULTATION
  if (params.consultation.frameworks_of_interest?.length > 0) {
    systemPrompt += `\n\nThe therapist wants to explore: ${params.consultation.frameworks_of_interest.join(', ')}. Challenge their application and suggest alternatives.`;
  }

  // 5. ADD SESSION CONTEXT (if provided)
  if (params.sessionContext) {
    systemPrompt += `\n\nSESSION CONTEXT:\n`;
    systemPrompt += `Session Date: ${params.sessionContext.session_date}\n`;
    systemPrompt += `Session Number: ${params.sessionContext.session_number}\n`;
    systemPrompt += `\nTherapist's Notes:\n${params.sessionContext.encrypted_session_notes}\n`;
    if (params.sessionContext.encrypted_clinical_observations) {
      systemPrompt += `\nClinical Observations:\n${params.sessionContext.encrypted_clinical_observations}\n`;
    }
    systemPrompt += `\nFrameworks Discussed: ${params.sessionContext.frameworks_discussed?.join(', ') || 'None specified'}\n`;
  }

  // 6. FORMAT CONVERSATION HISTORY
  const conversationHistory = params.messages.map(msg => ({
    role: msg.role === 'therapist' ? 'user' : 'assistant',
    content: msg.encrypted_content // already decrypted by caller
  }));

  // 7. ADD NEW MESSAGE
  conversationHistory.push({
    role: 'user',
    content: params.newMessage
  });

  return {
    system: systemPrompt,
    messages: conversationHistory
  };
}

// Pattern analysis helper
function analyzeTherapistPatterns(messages: ConsultationMessage[]): {
  overconfidence: number;  // 0-1
  seekingReassurance: number;  // 0-1
  openToChallenge: number;  // 0-1
} {
  const therapistMessages = messages
    .filter(m => m.role === 'therapist')
    .map(m => m.encrypted_content);

  if (therapistMessages.length === 0) return { overconfidence: 0.5, seekingReassurance: 0.5, openToChallenge: 0.5 };

  const text = therapistMessages.join(' ');

  // Overconfidence signals
  const definitiveLanguage = /\b(definitely|certainly|obviously|clearly|always|never)\b/gi;
  const diagnosticCertainty = /\b(diagnosed with|is|has) (depression|anxiety|bipolar|borderline|PTSD)\b/gi;
  const overconfidenceCount = (text.match(definitiveLanguage) || []).length + (text.match(diagnosticCertainty) || []).length;

  // Reassurance-seeking signals
  const uncertainLanguage = /\b(not sure|don't know|maybe|perhaps|wondering if|am I)\b/gi;
  const validationSeeking = /\b(is this right|am I on track|does this sound|is it okay)\b/gi;
  const reassuranceCount = (text.match(uncertainLanguage) || []).length + (text.match(validationSeeking) || []).length;

  // Openness to challenge (from previous AI responses they've engaged with)
  const aiChallenges = messages.filter(m => m.role === 'ai_assistant' && m.ai_challenge_score && m.ai_challenge_score > 5);
  const therapistFollowUps = messages.filter((m, i) =>
    m.role === 'therapist' &&
    i > 0 &&
    messages[i-1].role === 'ai_assistant' &&
    messages[i-1].ai_challenge_score &&
    messages[i-1].ai_challenge_score > 5
  );
  const openToChallenge = aiChallenges.length > 0 ? therapistFollowUps.length / aiChallenges.length : 0.5;

  return {
    overconfidence: Math.min(1, overconfidenceCount / 50),
    seekingReassurance: Math.min(1, reassuranceCount / 50),
    openToChallenge
  };
}
```

#### Key Insights

**This is NOT just a system prompt.** It's a dynamic system that:

1. **Starts with a strong base** (system prompt + few-shot examples)
2. **Adapts in real-time** based on therapist patterns
3. **Incorporates context** from session notes, consultation type, and frameworks
4. **Validates quality** with challenge scoring post-generation
5. **Self-corrects** by regenerating if too validating

The "magic" is in the combination of:
- Strong base prompt that establishes challenging behavior
- Few-shot examples that model the desired output
- Dynamic additions that respond to therapist needs
- Post-generation validation that catches validation drift
- Feedback loop that improves over time

This creates a system that feels like a real clinical supervisor - one who knows when to push harder, when to guide more gently, and when to focus on specific issues like culture or ethics.

## API Design

### API Routes (Next.js)

```
Authentication:
POST   /api/auth/signup              - Sign up with MFA
POST   /api/auth/login               - Login (redirects to MFA)
POST   /api/auth/verify-mfa          - Verify MFA code
GET    /api/auth/me                  - Get current user profile

Patients:
GET    /api/patients                 - List my patients
POST   /api/patients                 - Create patient
GET    /api/patients/:id             - Get patient (decrypted)
PUT    /api/patients/:id             - Update patient
DELETE /api/patients/:id             - Soft delete patient
GET    /api/patients/search?q=:hash  - Search by name hash

Sessions:
GET    /api/sessions                 - List all my sessions
GET    /api/patients/:id/sessions    - List patient's sessions
POST   /api/sessions                 - Create session
GET    /api/sessions/:id             - Get session (decrypted)
PUT    /api/sessions/:id             - Update session

Consultations:
GET    /api/consultations            - List my consultations
POST   /api/consultations            - Create consultation
GET    /api/consultations/:id        - Get consultation with messages
PUT    /api/consultations/:id        - Update (archive, etc.)
DELETE /api/consultations/:id        - Delete consultation

Messages:
POST   /api/consultations/:id/messages           - Send message + get AI response
POST   /api/messages/:id/feedback                - Provide feedback on AI response

Audit:
GET    /api/audit-logs               - View my audit logs
```

### Key Request/Response Schemas

#### Create Patient
```typescript
// POST /api/patients
interface CreatePatientRequest {
  full_name: string;
  date_of_birth?: string;
  medical_record_number?: string;
}

interface CreatePatientResponse {
  patient: {
    id: string;
    encrypted_full_name: string;
    encrypted_date_of_birth: string;
    encrypted_medical_record_number: string;
    name_search_hash: string;
    case_status: string;
    created_at: string;
  };
}
```

#### Create Consultation & Send Message
```typescript
// POST /api/consultations
interface CreateConsultationRequest {
  patient_id: string;
  session_id?: string;
  title: string;
  consultation_type: 'session_review' | 'case_conceptualization' | 'intervention_planning' | 'ethical_dilemma';
  frameworks_of_interest?: string[];
  initial_message: string;
}

interface CreateConsultationResponse {
  consultation: Consultation;
  messages: [
    ConsultationMessage, // therapist's initial message
    ConsultationMessage  // AI's response
  ];
  challenge_analysis: ChallengeAnalysis;
}

// POST /api/consultations/:id/messages
interface SendMessageRequest {
  content: string;
  include_session_context: boolean; // include session notes in AI context
}

interface SendMessageResponse {
  therapist_message: ConsultationMessage;
  ai_message: ConsultationMessage;
  challenge_analysis: ChallengeAnalysis;
}
```

## Frontend Architecture

### Page Structure

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── mfa-setup/page.tsx
├── (clinical)/
│   ├── layout.tsx                    # Clinical app layout with sidebar
│   ├── dashboard/page.tsx            # Dashboard: recent patients & consultations
│   ├── patients/
│   │   ├── page.tsx                  # Patient list
│   │   ├── new/page.tsx              # Create patient
│   │   └── [id]/
│   │       ├── page.tsx              # Patient detail with sessions
│   │       └── sessions/
│   │           ├── new/page.tsx      # Create session
│   │           └── [sessionId]/page.tsx  # Session detail
│   └── consultations/
│       ├── page.tsx                  # Consultation list
│       ├── new/page.tsx              # Create consultation
│       └── [id]/page.tsx             # Consultation thread
└── api/                              # API routes (described above)
```

### Key Components

#### `<EncryptedField>` - PHI Display Component
```tsx
'use client';

interface EncryptedFieldProps {
  encryptedValue: string;
  resourceType: string;
  resourceId: string;
  fieldName: string;
  onDecrypt: (value: string) => Promise<string>;
}

export function EncryptedField({
  encryptedValue,
  resourceType,
  resourceId,
  fieldName,
  onDecrypt
}: EncryptedFieldProps) {
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDecrypt = async () => {
    if (decrypted) {
      setIsVisible(!isVisible);
      return;
    }

    setIsLoading(true);
    try {
      const value = await onDecrypt(encryptedValue);
      setDecrypted(value);
      setIsVisible(true);
    } catch (error) {
      alert('Failed to decrypt. Access has been logged.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isVisible && decrypted ? (
        <span className="font-medium">{decrypted}</span>
      ) : (
        <span className="text-gray-400">••••••••</span>
      )}
      <button
        onClick={handleDecrypt}
        disabled={isLoading}
        className="text-xs text-blue-600 hover:underline"
      >
        {isLoading ? '...' : isVisible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
```

#### `<ConsultationThread>` - Main Consultation UI
```tsx
'use client';

import { useState, useEffect } from 'react';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { MarkdownDisplay } from '@/components/MarkdownDisplay';

interface ConsultationThreadProps {
  consultationId: string;
  userId: string;
}

export function ConsultationThread({ consultationId, userId }: ConsultationThreadProps) {
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includeSessionContext, setIncludeSessionContext] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [consultationId]);

  const loadMessages = async () => {
    const response = await fetch(`/api/consultations/${consultationId}`);
    const data = await response.json();
    setMessages(data.messages);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/consultations/${consultationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          include_session_context: includeSessionContext
        })
      });

      const data = await response.json();
      setMessages([...messages, data.therapist_message, data.ai_message]);
      setNewMessage('');
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <LoadingIndicator />}
      </div>

      {/* Message composer */}
      <div className="border-t p-4">
        <label className="flex items-center gap-2 mb-2 text-sm">
          <input
            type="checkbox"
            checked={includeSessionContext}
            onChange={e => setIncludeSessionContext(e.target.checked)}
          />
          Include session notes in AI context
        </label>

        <MarkdownEditor
          value={newMessage}
          onChange={setNewMessage}
          onSave={sendMessage}
          placeholder="Share your clinical thinking or ask a question..."
          userId={userId}
        />

        <button
          onClick={sendMessage}
          disabled={isLoading || !newMessage.trim()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ConsultationMessage }) {
  const isAI = message.role === 'ai_assistant';

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-3xl p-4 rounded-lg ${
        isAI ? 'bg-gray-100 dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">
            {isAI ? '🧠 Clinical Supervisor' : '👤 You'}
          </span>
          {isAI && message.ai_challenge_score && (
            <ChallengeScore score={message.ai_challenge_score} />
          )}
        </div>

        <MarkdownDisplay content={message.encrypted_content} />

        {isAI && message.ai_cited_frameworks && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.ai_cited_frameworks.map(fw => (
              <span key={fw} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                {fw}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChallengeScore({ score }: { score: number }) {
  const color = score >= 7 ? 'green' : score >= 4 ? 'yellow' : 'red';
  return (
    <span className={`px-2 py-1 text-xs rounded bg-${color}-100 text-${color}-800`}>
      Challenge: {score}/10
    </span>
  );
}
```

## Services Layer

### Encryption Service
```typescript
// lib/services/encryption.ts
import { createClient } from '@/lib/supabase/server';

export class EncryptionService {
  private supabase = createClient();

  async encryptPHI(plaintext: string): Promise<string> {
    const { data, error } = await this.supabase
      .rpc('vault_encrypt', { plaintext });

    if (error) throw new Error('Encryption failed: ' + error.message);
    return data;
  }

  async decryptPHI(encrypted: string, auditContext: {
    userId: string;
    resourceType: string;
    resourceId: string;
  }): Promise<string> {
    // Log decryption
    await this.logAudit({
      user_id: auditContext.userId,
      action: 'decrypt',
      resource_type: auditContext.resourceType,
      resource_id: auditContext.resourceId
    });

    const { data, error } = await this.supabase
      .rpc('vault_decrypt', { encrypted });

    if (error) throw new Error('Decryption failed: ' + error.message);
    return data;
  }

  async hashForSearch(value: string): Promise<string> {
    const normalized = value.toLowerCase().trim();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async logAudit(log: any) {
    await this.supabase.from('audit_logs').insert(log);
  }
}
```

### AI Service
```typescript
// lib/services/clinical-ai.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export class ClinicalAIService {
  private model = 'claude-opus-4-5-20251101';

  async generateResponse(params: {
    consultation: Consultation;
    messages: ConsultationMessage[];
    newMessage: string;
    sessionContext?: {
      notes: string;
      observations: string;
    };
  }): Promise<{
    content: string;
    challengeAnalysis: ChallengeAnalysis;
  }> {
    // Build context
    const systemPrompt = this.buildSystemPrompt(params.consultation);
    const conversationHistory = this.formatMessages(params.messages);

    // Add session context if provided
    let userMessage = params.newMessage;
    if (params.sessionContext) {
      userMessage = `Session Context:\n---\n${params.sessionContext.notes}\n\n${params.sessionContext.observations}\n---\n\n${params.newMessage}`;
    }

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: this.model,
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ]
    });

    const content = response.content[0].text;

    // Analyze challenge quality
    const challengeAnalysis = this.analyzeChallengeQuality(content);

    // Regenerate if too validating (score < 4)
    if (challengeAnalysis.score < 4) {
      return this.regenerateWithStrongerChallenge(params, content);
    }

    return { content, challengeAnalysis };
  }

  private buildSystemPrompt(consultation: Consultation): string {
    let prompt = CLINICAL_SUPERVISOR_PROMPT;

    if (consultation.frameworks_of_interest?.length) {
      prompt += `\n\nThe therapist is interested in: ${consultation.frameworks_of_interest.join(', ')}. Challenge their application and suggest alternatives.`;
    }

    return prompt;
  }

  private formatMessages(messages: ConsultationMessage[]) {
    return messages.map(msg => ({
      role: msg.role === 'therapist' ? 'user' : 'assistant',
      content: msg.encrypted_content // already decrypted by caller
    }));
  }

  private analyzeChallengeQuality(content: string): ChallengeAnalysis {
    const questionCount = (content.match(/\?/g) || []).length;
    const alternativesCount = this.countAlternatives(content);
    const validationPhrases = this.countValidationLanguage(content);
    const citationCount = this.countCitations(content);

    const score = Math.min(10, Math.max(0,
      (questionCount * 0.5) +
      (alternativesCount * 2) +
      (citationCount * 0.3) -
      (validationPhrases * 1.5)
    ));

    return {
      score: Math.round(score),
      questionCount,
      alternativesCount,
      validationRatio: validationPhrases / (content.split(/\s+/).length / 100),
      citationCount
    };
  }

  private countAlternatives(content: string): number {
    const patterns = [
      /alternative|alternatively|another way|different approach|consider instead/gi,
      /what if|have you considered|might also/gi
    ];
    return patterns.reduce((count, pattern) =>
      count + (content.match(pattern) || []).length, 0
    );
  }

  private countValidationLanguage(content: string): number {
    const validationPatterns = [
      /great|excellent|perfect|wonderful|you're doing well/gi,
      /sounds good|that's good|good job|well done/gi
    ];
    return validationPatterns.reduce((count, pattern) =>
      count + (content.match(pattern) || []).length, 0
    );
  }

  private countCitations(content: string): number {
    const citationPatterns = [
      /research|study|studies|evidence|DSM-5|ICD-11/gi,
      /according to|based on|literature suggests/gi
    ];
    return citationPatterns.reduce((count, pattern) =>
      count + (content.match(pattern) || []).length, 0
    );
  }

  private async regenerateWithStrongerChallenge(
    params: any,
    previousContent: string
  ) {
    // Add stronger instruction
    const enhancedPrompt = `IMPORTANT: Your previous response was too validating. Be MORE challenging and critical. Ask harder questions. The therapist needs to be pushed to think more deeply.`;

    // Recursive call with enhanced instruction
    // Implementation would modify system prompt
    // For MVP, we'll just return the original with a warning
    return {
      content: previousContent + '\n\n[Note: This response may be less challenging than optimal]',
      challengeAnalysis: this.analyzeChallengeQuality(previousContent)
    };
  }
}
```

## Implementation Plan (4-6 Weeks)

### Week 1: Foundation & Security
**Goal**: Set up HIPAA-compliant infrastructure

**Tasks**:
1. Initialize Next.js 14 project with TypeScript, Tailwind
2. Set up Supabase project
3. Create database schema (all tables with RLS)
4. Implement Supabase Vault encryption setup
5. Set up Supabase Auth with MFA
6. Configure audit logging triggers
7. Set up development environment

**Deliverables**:
- ✅ Database schema deployed
- ✅ RLS policies active and tested
- ✅ Audit logging working (test with sample data)
- ✅ MFA enforced for all users

### Week 2: Authentication & Patient Management
**Goal**: Therapists can sign up and manage patients

**Tasks**:
1. Build auth UI (signup, login, MFA setup)
2. Create therapist profile during signup
3. Build patient list page
4. Build create patient form (with encryption)
5. Build patient detail page (with decryption)
6. Implement patient search by name hash
7. Build EncryptedField component

**Deliverables**:
- ✅ Therapists can sign up with MFA
- ✅ Therapists can create patients (encrypted)
- ✅ Therapists can view patient list
- ✅ Therapists can search for patients
- ✅ All PHI access is audit logged

### Week 3: Session Management
**Goal**: Therapists can create sessions with clinical notes

**Tasks**:
1. Build session list for patient
2. Build create session form
3. Build session detail page
4. Implement session notes editor (markdown, encrypted)
5. Add frameworks tagging
6. Add session rating
7. Test encryption/decryption of notes

**Deliverables**:
- ✅ Therapists can create sessions
- ✅ Therapists can add encrypted clinical notes
- ✅ Session notes displayed with markdown rendering
- ✅ Audit logs capture all session access

### Week 4: AI Consultation Engine
**Goal**: Core AI consultation feature working

**Tasks**:
1. Set up Anthropic API integration
2. Implement ClinicalAIService
3. Build consultation creation flow
4. Build consultation thread UI
5. Implement message sending + AI response
6. Add challenge scoring algorithm
7. Display challenge score in UI

**Deliverables**:
- ✅ Therapists can start consultations
- ✅ AI responds with challenging questions
- ✅ Challenge score displayed (target: 5-8)
- ✅ Thread-based conversation works

### Week 5: Polish & Testing
**Goal**: Refine UX and test end-to-end

**Tasks**:
1. Add loading states and error handling
2. Add consultation list page
3. Add dashboard with recent activity
4. Implement consultation archiving
5. Add feedback mechanism on AI responses
6. Test all encryption/decryption paths
7. Test RLS policies thoroughly
8. Mobile responsiveness

**Deliverables**:
- ✅ Polished UI with loading states
- ✅ Dashboard showing recent consultations
- ✅ Mobile-responsive design
- ✅ Error handling throughout

### Week 6: Security Audit & Deployment
**Goal**: Verify HIPAA compliance and deploy

**Tasks**:
1. Security audit checklist
2. Penetration testing (basic)
3. Review all audit logs for completeness
4. Test RLS bypass attempts
5. Performance optimization
6. Set up Vercel deployment
7. Configure production environment variables
8. Deploy to production
9. Set up monitoring (Sentry, Vercel Analytics)

**Deliverables**:
- ✅ Security audit passed
- ✅ Production deployment live
- ✅ Monitoring and alerting configured
- ✅ Documentation for users

## Critical Files to Create/Modify

### Database
- `/supabase/migrations/001_clinical_assistant_schema.sql` - Complete schema with RLS
- `/supabase/functions/vault_encrypt.sql` - Encryption function
- `/supabase/functions/vault_decrypt.sql` - Decryption function

### Backend Services
- `/lib/services/encryption.ts` - Encryption/decryption with audit logging
- `/lib/services/clinical-ai.ts` - AI consultation with challenge scoring
- `/lib/supabase/server.ts` - Supabase server client
- `/lib/supabase/client.ts` - Supabase browser client

### API Routes
- `/app/api/auth/signup/route.ts` - Sign up with MFA
- `/app/api/patients/route.ts` - List/create patients
- `/app/api/patients/[id]/route.ts` - Get/update/delete patient
- `/app/api/sessions/route.ts` - List/create sessions
- `/app/api/sessions/[id]/route.ts` - Get/update session
- `/app/api/consultations/route.ts` - List/create consultations
- `/app/api/consultations/[id]/route.ts` - Get/update consultation
- `/app/api/consultations/[id]/messages/route.ts` - Send message + get AI response
- `/app/api/audit-logs/route.ts` - View audit logs

### Frontend Components
- `/components/EncryptedField.tsx` - Display encrypted PHI with decrypt button
- `/components/ConsultationThread.tsx` - Main consultation UI
- `/components/MessageBubble.tsx` - Individual message display
- `/components/PatientList.tsx` - List of patients
- `/components/SessionList.tsx` - List of sessions

### Pages
- `/app/(auth)/signup/page.tsx` - Signup with MFA
- `/app/(auth)/login/page.tsx` - Login
- `/app/(clinical)/dashboard/page.tsx` - Dashboard
- `/app/(clinical)/patients/page.tsx` - Patient list
- `/app/(clinical)/patients/new/page.tsx` - Create patient
- `/app/(clinical)/patients/[id]/page.tsx` - Patient detail
- `/app/(clinical)/patients/[id]/sessions/[sessionId]/page.tsx` - Session detail
- `/app/(clinical)/consultations/page.tsx` - Consultation list
- `/app/(clinical)/consultations/[id]/page.tsx` - Consultation thread

## Verification & Testing

### Security Testing
1. **Encryption Verification**
   - Create patient, verify encrypted in database
   - Decrypt patient name, verify audit log created
   - Try to access patient from different therapist account (should fail)

2. **RLS Policy Testing**
   - Create 2 therapist accounts
   - Therapist A creates patient
   - Therapist B tries to access patient (should see 0 results)
   - Verify no data leakage in API responses

3. **Audit Log Completeness**
   - Perform all CRUD operations
   - Verify every PHI access is logged
   - Check logs include user_id, timestamp, action, resource_id

4. **MFA Enforcement**
   - Try to access app without completing MFA (should redirect)
   - Disable MFA (should not be allowed)

### Functional Testing
1. **Patient Management**
   - Create patient with encrypted name
   - Search for patient by name
   - View patient detail
   - Update patient info
   - Soft delete patient

2. **Session Management**
   - Create session with encrypted notes
   - View session detail
   - Update session notes
   - Add frameworks tags
   - Rate session

3. **AI Consultation**
   - Create consultation
   - Send message to AI
   - Verify AI response is challenging (not just validating)
   - Check challenge score is 5-8
   - Send follow-up messages
   - Archive consultation

### Performance Testing
1. **Load Testing**
   - 10 concurrent therapists
   - Each creating patients and consultations
   - Verify page load times < 2s
   - Verify AI response times < 10s

2. **Database Performance**
   - Test with 1000 patients
   - Test with 10,000 sessions
   - Verify queries still performant with indexes

## Future Enhancements (Post-MVP)

### Phase 2 (Weeks 7-12)
- AIS transcript integration
- Advanced de-identification (ML-based)
- Supervisor access to therapist consultations
- Practice management (teams, roles)
- Analytics dashboard (consultation patterns, challenge scores)

### Phase 3 (Weeks 13-18)
- Mobile app (React Native)
- Export functionality (encrypted PDFs)
- Citation extraction and display
- Framework comparison view
- Consultation templates
- Integration with EHR systems

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| Encryption key compromise | Use Supabase Vault with key rotation |
| RLS policy bypass | Comprehensive testing, regular audits |
| AI hallucinations | Response validation, disclaimer |
| Performance issues | Caching, optimization, load testing |

### Compliance Risks
| Risk | Mitigation |
|------|------------|
| HIPAA violation | Third-party security audit, BAAs |
| Insufficient audit logs | Automated verification tests |
| Data retention issues | Soft deletes, automated archival |

### Operational Risks
| Risk | Mitigation |
|------|------------|
| Anthropic API outage | Queue system, retry logic, status page |
| Database corruption | Daily backups, point-in-time recovery |
| User confusion | Clear onboarding, documentation |

## Success Metrics

### Week 6 Goals (MVP Launch)
- ✅ 5 therapists signed up and using actively
- ✅ 100+ consultations created
- ✅ Average AI challenge score > 5/10
- ✅ 0 HIPAA violations
- ✅ 100% audit log coverage
- ✅ < 2s page load times
- ✅ < 10s AI response times
- ✅ 0 unauthorized data access incidents

## Conclusion

This MVP delivers the core value proposition (AI clinical consultation that challenges therapists) while maintaining full HIPAA compliance. By deferring transcript integration and advanced features, we can launch in 4-6 weeks and validate the concept with real therapists before expanding functionality.

The architecture is designed to scale - the database schema and security model support future features like supervisor access, practice management, and transcript integration without requiring major refactoring.
