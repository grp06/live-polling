# Agent Workflow

**All planning artifacts (execplans, CURRENT.md, journals) must be saved in the project's `.agent/` folder.** Code, tests, and README updates may live in the normal repo locations unless explicitly directed otherwise.

## Autonomy Mode (default)

The agent should operate autonomously:

- **Maximize uninterrupted execution**: Proceed without stopping through execplan → tests → implementation until completion or a new blocker appears.
- **If a new blocker appears mid-run**: Pause once with a consolidated question list; then continue as above once resolved.

## Start-to-Finish Flow

The workflow adapts to different starting points. Begin at the appropriate step based on what exists:

### Starting Points

**Option A: Continuing existing work**
- Some execplans already exist
- Check `.agent/CURRENT.md` to determine current state
- I tell you to continue work
- Begin at the appropriate step based on CURRENT.md

### Workflow Steps

1. **ExecPlan Creation**: If there is no execplan, use `.agent/execplans/PLANS.md` to create `.agent/execplans/execplan.md`

2. **Test-First Development**: Before implementing the execplan, write failing tests that will pass after implementation

3. **Implementation**: Execute the execplan carefully, ensuring tests pass. Make commits at reasonable checkpoints when functionality is working and tested.

**Never skip execplans.** If requirements are missing or ambiguous, stop and ask for clarification.

## Memory System

You will stay consistent across long-running development cycles using two memory mechanisms:

### Current State (`.agent/CURRENT.md`)
**Keep this file constantly updated** - it serves as the agent's working memory:

- **Active execplan path**: Current execplan file being worked on
- **Last known failing tests summary**: Current test failures and their status
- **Next 1-3 concrete actions**: Specific, actionable next steps
- **Temporary constraints**: Any "do not refactor X until Y passes" type rules

**Update CURRENT.md before/after every major action and after each execplan milestone.**

### Development Journal (`.agent/journal/YYYY-MM-DD-HH-MM-SS.md`)
**Individual timestamped entries** - the agent's persistent memory:

- **What changed, why**: Record all modifications and reasoning
- **What was observed**: Test output snippets, error messages, unexpected behavior
- **Links to commits**: Reference any git commits made

**Create a new timestamped journal file after every significant event. Make commits at reasonable checkpoints and always link them in journal entries.**

## Testing Requirements

- Use **Jest** for unit and integration tests
- Write tests BEFORE implementation (TDD approach)
- Tests must fail initially, then pass after implementation
- Tests should be comprehensive but focused on the functionality being built
- Tests must execute deterministically and **offline** (no real network calls)
- Mock `fetch`, API routes, databases, and external services
- Follow the testing pyramid: many unit tests, some integration tests, few high-value acceptance tests

## Commit Strategy

- **Make commits at reasonable checkpoints** when functionality is working and tested
- **Atomic commits**: Each commit should represent a single, complete piece of functionality
- **Meaningful commit messages**: Include what was implemented and why
- **Link commits in journal entries**: Always reference commit hashes in the development journal
- **Before major changes**: Commit current working state as a checkpoint
- **After completing functionality**: Commit when tests pass and feature works end-to-end

## ExecPlans

ExecPlans follow the process described in `.agent/execplans/PLANS.md` and provide a structured approach from design to implementation. **All execplans must be saved in `.agent/execplans/execplan.md`.**


# IMPORTANT: Fully understand the project before starting. After starting, follow through completely without stopping. Maintain the memory system (CURRENT.md and journal files) throughout the entire process.
