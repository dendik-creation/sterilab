# REUSABLE MASTER PROMPT
## FIGCRAFT UI SLICING, INTERACTIVE SCENE IMPLEMENTATION & QUICK AUDIT

**Role:** Act as a Senior Frontend Engineer, UI Implementation Specialist, and Interactive Scene Developer.

**Objective:** Slice an existing UI design using Figcraft, integrate the generated assets and components into the target workspace, implement the required scene interactions, and perform a quick browser-based UI audit using Playwright.

**Core Principles:**
- Reusable, modular, maintainable, and project-consistent implementation.
- Design fidelity must be preserved.
- Reuse existing project architecture, components, utilities, and conventions.
- Avoid unnecessary modifications outside the target scene.
- Use the available tools and skills instead of relying on assumptions.
- Prioritize working interactions over static visual-only implementation.

---

# SECTION 1 — VARIABLES

Define and resolve the following variables before starting any implementation.

## 1.1 Primary Asset Path

**ASSET_PATH:** `{SINGLE_ASSET_PATH}`

The primary asset file or directory containing the main visual resources required for this scene.

Rules:
- Treat this as the primary asset source.
- Preserve original filenames unless renaming is necessary.
- Inspect the available assets before creating replacements.
- Avoid generating duplicate assets.

## 1.2 Additional Assets

**OTHER_ASSET:**
- `{ADDITIONAL_ASSET_PATH_1}`
- `{ADDITIONAL_ASSET_PATH_2}`
- `{ADDITIONAL_ASSET_PATH_3}`
- `{OPTIONAL_ADDITIONAL_ASSET_PATH}`

Rules:
- Additional assets may include images, icons, fonts, animations, audio, and other supporting resources.
- Reuse existing assets whenever possible.
- Maintain consistent scaling, proportions, and visual style.
- Skip empty or undefined entries.

## 1.3 Workspace Target

**WORKSPACE_TARGET:** `{TARGET_WORKSPACE_FOLDER}`

This is the specific workspace directory where the target scene must be created or updated.

Rules:
- Inspect the existing folder structure before implementation.
- Follow the project's established framework and architecture.
- Reuse existing components, layouts, hooks, utilities, and styling conventions.
- Keep new scene-specific files inside the designated workspace or its established shared directories.
- Do not overwrite unrelated files or modify unrelated scenes.
- Preserve existing application functionality.

## 1.4 Design Pattern & Project Context

**DESIGN_PATTERN_PATH:**
- `DESIGN_FLOW_APP.md`
- `docs/`
- `CONTEXT.md`

Before implementing:

1. Read `CONTEXT.md` to understand the application's purpose, architecture, and current development state.
2. Read `DESIGN_FLOW_APP.md` to understand navigation, scene relationships, expected design patterns, and interaction flow.
3. Inspect relevant documentation inside `docs/` for implementation conventions, UI specifications, and technical constraints.
4. Inspect the target workspace and reusable components.
5. Identify existing dependencies, design tokens, and interaction patterns.

**Instruction Priority:**
1. Explicit requirements in this prompt.
2. Relevant project context and design flow.
3. Existing architecture and established implementation conventions.
4. Reasonable implementation defaults.

If instructions conflict, preserve existing working functionality and report the conflict rather than silently guessing.

---

# SECTION 2 — LOAD TOOLS (SKILLS & MCP)

Discover and load the necessary tools before executing the task.

## 2.1 Required Skills

**SKILLS:**
- `impeccable` — UI quality, visual consistency, layout refinement, and design implementation best practices.
- `playwright-cli` — Browser automation, visual inspection, interaction testing, and quick UI validation.
- `{OPTIONAL_SKILL_1}`
- `{OPTIONAL_SKILL_2}`

**Skill Loading Rules:**

1. Check whether each skill is available in the current environment.
2. Read the relevant skill instructions before using it.
3. Follow its documented workflow and supported commands.
4. Load only relevant skills needed for this task.
5. Do not assume a skill exists or invent unsupported commands.

## 2.2 Required MCP Servers

**MCP_SERVERS:**
- `figcraft` — UI design inspection, slicing, asset extraction, and design-to-code support.
- `codebase-memory-mcp` — Codebase context retrieval, architecture awareness, and existing implementation discovery.
- `context7` — Current framework and library documentation when required.
- `{OPTIONAL_MCP_SERVER}`

**MCP Execution Rules:**

1. Discover the available MCP tools and their supported operations.
2. Use `codebase-memory-mcp` to identify relevant files, reusable components, patterns, and existing implementations when available.
3. Use `figcraft` for the selected design slicing workflow.
4. Use `context7` when framework-specific documentation or unfamiliar APIs require verification.
5. Avoid unnecessary or redundant tool calls.
6. If a required tool is unavailable, use an existing supported alternative and explicitly report any resulting limitation.

**Execution Strategy:**

`Inspect Context → Load Tools → Inspect Design → Slice UI → Implement Scene → Implement Actions → Audit`

---

# SECTION 3 — FIGCRAFT SLICING UI

Use Figcraft as the primary design reference for the target scene.

## 3.1 Target Page

**TARGET_PAGE:** `{TARGET_PAGE_NAME_OR_ID}`

This identifies the specific page, scene, frame, or design view that must be sliced.

## 3.2 Target Canvas

**TARGET_CANVAS:** `{TARGET_CANVAS_NAME_OR_SIZE}`

Examples:
- `1920x1080`
- `1440x900`
- `Desktop / Main Scene`
- `Frame / Scene 04`

Respect the target canvas dimensions, aspect ratio, and intended layout behavior.

## 3.3 Other Information

**OTHER_INFO:**
- `{DESIGN_REQUIREMENT_1}`
- `{DESIGN_REQUIREMENT_2}`
- `{DESIGN_REQUIREMENT_3}`
- `{INTERACTION_OR_LAYOUT_NOTES}`
- `{OPTIONAL_EXTENDED_INSTRUCTIONS}`

Additional instructions may describe:
- Visual appearance and styling.
- Element positioning and alignment.
- Responsive behavior.
- Asset references and naming.
- Component boundaries.
- Navigation relationships.
- Special interaction requirements.
- Constraints and exceptions.

## 3.4 Figcraft Slicing Procedure

Execute the following steps:

1. Locate and inspect `TARGET_PAGE` within `TARGET_CANVAS`.
2. Understand the visual hierarchy, layout structure, and component relationships.
3. Identify static elements, interactive elements, and reusable UI components.
4. Slice or extract the required UI elements using Figcraft's available capabilities.
5. Map extracted elements to existing project assets and components.
6. Implement the scene using the current project's framework and styling conventions.
7. Match the reference design's dimensions, spacing, colors, typography, borders, shadows, and element positioning.
8. Preserve the visual relationship between all scene elements.
9. Ensure the resulting UI fits the target canvas without unintended overflow, clipping, or distortion.
10. Integrate the scene into the existing application flow without breaking other pages.

**Design Fidelity Constraints:**
- Do not unnecessarily redesign the reference UI.
- Do not substitute existing assets without a clear reason.
- Do not introduce unrelated decorative elements.
- Do not change global styles unless explicitly required.
- Do not modify unrelated pages.
- Keep assets and components reusable whenever practical.

**Expected Result:** A visually accurate, integrated, and maintainable scene based on the specified Figcraft design.

---

# SECTION 4 — DEFINED ACTION IN SLICING UI BASED FIGCRAFT

This section defines the complete interactive lifecycle of the sliced scene, from opening to closing.

Each action must identify its trigger, expected system behavior, state transition, and user feedback.

## 4.1 Scene Initialization

**ACTION_ID:** `SCENE_INIT`

**Trigger:** The user navigates to or opens the target scene.

**Required Behavior:**
- Load the required visual assets.
- Initialize scene-specific state variables.
- Render the initial UI.
- Initialize relevant interactive components.
- Restore or reset progress according to the project requirements.
- Display the scene's initial state.

**Initial State:** `{INITIAL_SCENE_STATE}`

**Expected Feedback:** `{INITIAL_FEEDBACK_OR_ANIMATION}`

## 4.2 User Interaction Actions

Define each interactive element using the following reusable skeleton.

### ACTION_01 — {ACTION_NAME}

- **Element:** `{TARGET_UI_ELEMENT}`
- **Interaction Type:** `{CLICK | HOVER | DRAG_DROP | INPUT | SWIPE | KEYBOARD | OTHER}`
- **Trigger Condition:** `{WHEN_ACTION_CAN_EXECUTE}`
- **User Action:** `{WHAT_THE_USER_DOES}`
- **System Action:** `{WHAT_THE_APPLICATION_DOES}`
- **State Before:** `{STATE_BEFORE_INTERACTION}`
- **State After:** `{STATE_AFTER_INTERACTION}`
- **Visual Feedback:** `{ANIMATION_OR_VISUAL_CHANGE}`
- **Text / Audio Feedback:** `{MESSAGE_OR_AUDIO_RESPONSE}`
- **Validation:** `{SUCCESS_OR_FAILURE_CONDITION}`
- **Fallback / Error Behavior:** `{INVALID_ACTION_RESPONSE}`

### ACTION_02 — {ACTION_NAME}

- **Element:** `{TARGET_UI_ELEMENT}`
- **Interaction Type:** `{INTERACTION_TYPE}`
- **Trigger Condition:** `{TRIGGER_CONDITION}`
- **User Action:** `{USER_ACTION}`
- **System Action:** `{SYSTEM_RESPONSE}`
- **State Before:** `{PREVIOUS_STATE}`
- **State After:** `{NEXT_STATE}`
- **Visual Feedback:** `{VISUAL_FEEDBACK}`
- **Text / Audio Feedback:** `{USER_FEEDBACK}`
- **Validation:** `{VALIDATION_RULE}`
- **Fallback / Error Behavior:** `{ERROR_HANDLING}`

### ACTION_N — {ACTION_NAME}

Repeat the same structure for every additional interactive element or action.

Actions may include:
- Button clicks and navigation.
- Hover and tooltip behavior.
- Drag-and-drop operations.
- Input and form submissions.
- Interactive simulations.
- Object selection and manipulation.
- Correct and incorrect answer handling.
- Progress updates.
- Reset and retry interactions.
- Audio, animation, and visual feedback.
- Scene transitions.

## 4.3 Conditional Logic & State Management

**STATE_VARIABLES:**
- `{STATE_VARIABLE_1}`
- `{STATE_VARIABLE_2}`
- `{STATE_VARIABLE_3}`

**CONDITIONAL_RULES:**
- `{IF_CONDITION_THEN_ACTION}`
- `{SUCCESS_CONDITION}`
- `{FAILURE_CONDITION}`
- `{RETRY_CONDITION}`
- `{PROGRESSION_CONDITION}`

Implementation requirements:

1. Every interactive element must have a defined and functional behavior.
2. State transitions must be deterministic and consistent.
3. Invalid interactions must not corrupt the scene state.
4. Provide immediate and appropriate feedback when required.
5. Prevent duplicate actions when they could cause unexpected behavior.
6. Use existing project state-management patterns.
7. Keep business logic separate from presentation components where practical.

## 4.4 Scene Completion

**ACTION_ID:** `SCENE_COMPLETE`

**Completion Condition:** `{SCENE_COMPLETION_REQUIREMENTS}`

**System Behavior:**
- Validate required actions or objectives.
- Update relevant progress or completion state.
- Display the configured completion feedback.
- Unlock the next interaction or scene when appropriate.
- Persist completion data only if supported by project requirements.

**Completion Feedback:** `{SUCCESS_MESSAGE_OR_VISUAL}`

## 4.5 Scene Exit & Navigation

**ACTION_ID:** `SCENE_EXIT`

**Trigger:** `{BACK_BUTTON | HOME_BUTTON | NEXT_BUTTON | EXIT_ACTION}`

**System Behavior:**
- Validate any required exit conditions.
- Save or discard state according to project requirements.
- Clean up scene-specific resources, listeners, and temporary effects.
- Navigate to the correct destination.
- Prevent duplicate or unintended transitions.

**Destination:** `{TARGET_ROUTE_OR_SCENE}`

**Expected Result:** The user exits or transitions from the scene without errors, broken navigation, or unexpected state loss.

## 4.6 Action Implementation Rules

- Implement all explicitly defined actions.
- Do not invent critical gameplay, assessment, or navigation rules.
- Reuse existing interaction utilities and components.
- Support applicable pointer, mouse, touch, and keyboard interactions.
- Preserve the scene's visual design during state changes.
- Avoid implementing decorative buttons that do nothing.
- Leave undefined optional actions unimplemented and report them as pending instead of fabricating behavior.

---

# SECTION 5 — AUDIT UI (QUICK PLAYWRIGHT)

Perform a fast, targeted UI audit using the available Playwright tooling after implementation.

**Audit Goal:** Verify design rendering, essential interactions, state transitions, and navigation with minimal unnecessary testing overhead.

## 5.1 Start & Inspect

1. Identify the project's existing development or preview command.
2. Start or reuse the available local development server.
3. Open the target page using Playwright.
4. Set the browser viewport to `TARGET_CANVAS` when it specifies dimensions.
5. Wait for the scene and required assets to finish rendering.
6. Capture an initial screenshot.

## 5.2 Visual Audit

Verify:
- [ ] Target page loads successfully.
- [ ] Canvas dimensions and aspect ratio are respected.
- [ ] Layout matches the Figcraft reference.
- [ ] Assets, icons, images, and fonts load correctly.
- [ ] No unexpected clipping or horizontal overflow.
- [ ] No misplaced or overlapping UI elements.
- [ ] Text is readable and properly aligned.
- [ ] Interactive elements appear in the intended positions.

Compare the rendered page with the Figcraft reference when both are available.

## 5.3 Interaction Audit

Use Playwright to test the primary user journey:

1. Open the scene.
2. Execute each required critical action.
3. Verify the expected UI response.
4. Verify state transitions.
5. Test at least one relevant invalid interaction when applicable.
6. Verify completion behavior.
7. Test scene exit and navigation.

**Interaction Checklist:**
- [ ] Buttons respond correctly.
- [ ] Relevant hover, click, drag, or input actions work.
- [ ] Interactive feedback appears correctly.
- [ ] State transitions behave as specified.
- [ ] Invalid interactions are handled safely.
- [ ] Scene completion works.
- [ ] Navigation and exit work.

## 5.4 Runtime Audit

Check for:
- JavaScript runtime errors.
- Broken assets and failed resource requests.
- Critical console errors.
- Unhandled interaction errors.
- Broken routes.
- Unexpected UI state or rendering failures.

Fix issues introduced by the implementation. Avoid unrelated refactoring.

## 5.5 Quick Fix & Recheck

If an issue is detected:

1. Identify the cause.
2. Apply the smallest safe correction.
3. Re-run the affected Playwright check.
4. Verify that the correction does not break the main scene flow.

Prioritize critical functional issues and obvious visual mismatches.

Do not run unnecessarily broad test suites unless required by the detected issue.

## 5.6 Final Delivery Report

After implementation and auditing, return a concise report using this structure:

**IMPLEMENTATION SUMMARY**
- Target Page: `{TARGET_PAGE}`
- Target Canvas: `{TARGET_CANVAS}`
- Workspace: `{WORKSPACE_TARGET}`
- Implementation Status: `{COMPLETE | PARTIAL | BLOCKED}`

**UI SLICING**
- Components created or updated.
- Assets integrated.
- Design fidelity observations.

**INTERACTIVE ACTIONS**
- Actions implemented.
- State transitions supported.
- Completion and navigation behavior.

**PLAYWRIGHT AUDIT**
- Visual Audit: `{PASS | FAIL | NOT_TESTED}`
- Interaction Audit: `{PASS | FAIL | NOT_TESTED}`
- Runtime Audit: `{PASS | FAIL | NOT_TESTED}`
- Issues Found: `{ISSUE_SUMMARY}`
- Issues Fixed: `{FIX_SUMMARY}`

**MODIFIED FILES**
- `{FILE_PATH_1}`
- `{FILE_PATH_2}`
- `{FILE_PATH_N}`

**REMAINING ITEMS**
- `{PENDING_ITEM_OR_NONE}`

**Final Rules:**
- Do not report checks as passed unless they were actually executed.
- Do not claim successful tool execution without tool results.
- Report missing tools, assets, or references transparently.
- Complete the implementation and quick audit within the current execution when the environment supports them.
- Preserve existing working features.
- The final deliverable must be a functional scene, not merely a static screenshot or design description.

**END OF REUSABLE MASTER PROMPT**
