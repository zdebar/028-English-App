# CLEAN CODE GUIDE

## Quick Reference

|   # | Area                                  | Topics                                                 |
| --: | ------------------------------------- | ------------------------------------------------------ |
|   1 | Before you start                      | Goal, constraints, scenarios, definition of done       |
|   2 | Interfaces and system boundaries      | Modules, responsibilities, dependencies, architecture |
|   3 | Data and state                        | Ownership, data flow, database invariants             |
|   4 | API and application logic             | Validation, contracts, pure logic, side effects       |
|   5 | Reliability under failure             | Timeouts, retries, idempotency, resources              |
|   6 | Concurrency and consistency            | Transactions, atomic changes, queues                  |
|   7 | Security                              | Authentication, authorization, secrets, inputs        |
|   8 | Testing                               | Unit, integration, and end-to-end tests               |
|   9 | Operations and observability           | Logs, metrics, tracing, configuration                 |
|  10 | Refactoring an existing system         | Small steps, migrations, rollback paths                |
|  11 | Choosing an architecture              | Layers, modular monolith, events, services            |
|  12 | Work checklists                        | Before a PR, before deployment, during an incident    |

## 1. Requirements

- **Requirements and constraints** — permissions, speed, availability, data volume, compatibility, impact on existing users
- **Scenarios** — happy path, edge-case inputs, permissions, failures, concurrency

## 2. Interfaces and System Boundaries

- **Public interface** — abstractions, interfaces, docstrings, documentation, tests

## 3. Data and State

- **State** — owner, lifetime
- **Visible data flow** — loading, null, error; subscriptions, listeners, streams, cache
- **Security** — frontend, backend, database; all write paths, scripts, future APIs, concurrent requests
- **Database** — normalize or denormalize for performance

## 4. API and Application Logic

a. Client-server contract
- **Contract** — valid input, result, errors, permissions, side effects
- **OpenAPI** — versioned and documented

b. HTTP request
- **Identity** — authenticate
- **Input** — validate shape, size, and format
- **Authorization** — verify permission for the specific object and operation
- **Application rule** — apply
- **Change** — persist atomically
- **Result** — return a stable result

## 5. Reliability Under Failure

a. Outcome types
- **Expected rejection** — return an explicit result
- **Unexpected failure** — record safe context, return an appropriate error
- **Unknown outcome** — check the status or retry the request with a stable idempotency key

b. Rules
- **Timeout** — limits wait time; does not guarantee cancellation of the remote operation
- **Retry** — only for transient errors, with a finite attempt count, an overall time limit, and jitter
- **Stable idempotency key** — repeated requests must return the same logical result without repeating the operation
- **Same key, different payload** — reject the request
- **Single retry owner** — choose one layer to decide when and how to retry

c. Limit resource use
- **HTTP** — maximum request body size, rate limit
- **Database** — connection pool budgeted across all instances, query timeout
- **Queue** — capacity, worker concurrency, maximum retries, job age
- **Responses** — pagination, maximum number of returned records

## 6. Concurrency and Consistency

a. Avoid unprotected read-then-write; use a SQL transaction.

b. Choose a tool based on the invariant
- **One conditional row change** — atomic `UPDATE`
- **Multiple database changes that must succeed together** — transaction
- **Protection from stale edits** — optimistic version / compare-and-swap
- **Rare conflict that requires serialization** — lock or stronger isolation
- **Long-running work outside a request** — durable queue and idempotent worker

c. Asynchronous work and queues
- **Job state** — persist `queued`, `running`, `succeeded`, `failed`
- **Transactional outbox**

## 7. Security

a. Three checks
- **Validation** — input correctness
- **Authentication** — session or verified token
- **Authorization** — may this identity perform this action on this resource?

b. Practical backend rules
- **Permissions** — verify for every object and every operation
- **Tenant or user ID** — derive from verified identity, not the request body
- **SQL** — use parameterized queries
- **Secrets** — store in a secrets manager or runtime configuration
- **Database account privileges** — separate public and server keys; grant only the permissions needed
- **Request limits** — validate payload size; set upload and rate limits

## 8. Testing

a. Types
- **Unit tests** — pure rules and edge cases
- **Integration tests** — real adapters and database rules
- **End-to-end tests** — an important user journey through the whole system
- **Load tests** — capacity and behavior under concurrency

b. Test matrix for an API change
- **Valid input** — owned by the caller
- **Invalid input** — `4xx`; database unchanged
- **No identity** — `401`; no sensitive details returned
- **Someone else's object** — `403` or consistent `404`, according to policy
- **Duplicate request** — same logical result, no duplicate operation
- **Database error** — no false success; safe log and appropriate status
- **Concurrency** — invariant remains intact

## 9. Operations and Observability

a. Logging
- **Request or trace ID** — operation type and safe context
- **Error** — type, processing time, retry count, result
- **Queue** — job count and age; a healthy HTTP server can still have blocked background jobs
- **Alerts** — only for impacts that require action; include recovery instructions

b. Protect data in telemetry
- **Sensitive data** — never log passwords, tokens, full payment payloads, or unnecessary personal data
- **Metric labels** — keep cardinality low; do not use user IDs or order IDs as labels
- **Retention and access** — set retention, access rights, and sampling based on purpose and volume

c. Configuration and deployment
- **Startup configuration** — load and validate at startup; fail with a clear message if invalid
- **Secrets and environments** — separate secrets from regular configuration, and development values from production values
- **Database migrations** — use a compatible sequence: add → backfill → switch reads/writes → remove old
- **Deployment** — first deploy the change so old and new versions can safely run side by side briefly

## 10. Refactoring an Existing System

1. Safe, incremental process

   | Step | Action |
   |---|---|
   | 1. Capture behavior | Add a characterization test or input → output examples. |
   | 2. Create a boundary | Introduce a small interface or function around the responsibility being changed. |
   | 3. Move one thing | Separate a rule, persistence, or service call without changing business logic at the same time. |
   | 4. Verify equivalence | Run targeted tests, compare results, and log differences if needed. |
   | 5. Remove transitional code | Delete the old path and temporary flags once the migration is verified. |

## 11. Choosing an Architecture

Choose the smallest structure that protects important boundaries. Splitting into processes adds network failures, more deployments,
monitoring, service-to-service authentication, and harder recovery.

- **Monolith** — default
- **Microservices** — when a component needs to scale or deploy independently, or has a different owner
