<!-- ai-office:managed project-instructions v2 -->
# recalibra project instructions

## Mission

Sviluppare Recalibra, app mobile per la gestione dello stress attraverso esercizi guidati di respirazione, vocali e movimento, con monitoraggio dello stress prima e dopo le sessioni.

## Operating policy

- Reasoning: architecture-first
- Autonomy: high
- Code changes: autonomous
- Architecture changes: approval-required
- ADR creation: allowed
- Inspect before non-trivial work: true
- Plan before non-trivial work: true
- Review implementation after execution: true
- Preserve architectural invariants: true

## Repository map

- Inspect the bound repository and its current documentation before changing it

## Architectural invariants

- Mantenere i dati utente in SQLite locale e preservare i dati esistenti con migrazioni additive e idempotenti.
- Mantenere identita e autenticazione locali; non introdurre backend remoto, analytics o AI nel runtime mobile senza una richiesta esplicita.
- Mantenere gratuito l’accesso a tutti gli esercizi e audio, senza paywall, subscription o pagamenti nel runtime.
- Mantenere separati app mobile, sito marketing e strumenti MCP di sviluppo.
- Non committare segreti o registrare nei log chiavi SDK e dati sensibili degli utenti.

## Development workflow

- Run `ai-office next` to read the recommended next action before proposing work; it reports the real handover state, not a guess
- When asked to take this project in charge, hand it over, or onboard it, follow the handover workflow in the repository-local `ai-office` skill instead of improvising one
- Handover transfers organizational context ownership; it grants no capability and bypasses no approval
- Pipeline guidance describes expected work; it is not the security boundary
- When an enforced runtime pipeline is active, AI Office authorization, assignments, approvals, and stage transitions are authoritative
- Protected operations must use action requests and must not bypass runtime gates
- Feature delivery [guidance]: Design -> Implement -> Review -> Verify
- Bug fix [guidance]: Reproduce -> Fix -> Review
- Research [guidance]: Investigate
- Release [guidance]: Readiness review -> Release verification

## Testing requirements

- Run the narrowest relevant tests, then the repository's complete check suite

## Documentation hierarchy

- Follow the repository's documented hierarchy of current guidance

## Definition of done

- Acceptance criteria, tests, typecheck, documentation, and implementation review pass
