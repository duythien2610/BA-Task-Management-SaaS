# TaskFlow Business Analysis Documentation

This repository serves as the central hub for the business analysis, system design, and technical requirement documents of **TaskFlow**, a Work Management SaaS Platform designed for Agencies and SMEs.

These documents establish the scope, architecture, and development roadmap of the platform, with a primary focus on the Q2/2025 Minimum Viable Product (MVP).

## System Capabilities

TaskFlow provides a performance-oriented workflow optimization platform with the following core functionalities:

* **Workspace and Project Management**: Centralized management of projects and task lists across multiple views (Kanban, List, Calendar).
* **Advanced Task Workflows**: Capabilities including bulk actions (modify status, reassign, update due dates) to synchronize changes efficiently across multiple tasks.
* **Permission Module**: A tiered and secure multi-tenant role-based access control (RBAC) system with five fixed roles: Owner/Director, Admin, Project Manager, Member, and Client (Read-Only).
* **Time Tracking and Billing Summary**: Task-based time logging and automated client billing calculation based on project-specific hourly rates, specifically tailored for agency workflows.
* **Notification System**: Immediate in-app and email alerts tailored to task events (assignments, overdue status, new comments) with granular user preference controls.
* **Export and Reporting**: Three core export configurations (Project Progress, Task List, Team Workload) strictly formatted in Excel and PDF for professional client-shareable status reporting.

## Repository Structure

The documentation and deliverables are structured as follows:

* **`docs/`**: Contains the final specification documents detailing requirements and scope.
  * **Business Case**: Commercial feasibility and return on investment analysis.
  * **Business Requirements Document (BRD)**: High-level business constraints and requirements.
  * **Software Requirements Specification (SRS)**: Detailed functional and non-functional engineering specifications.
  * **Scope Document**: Definition of the MVP boundaries, specifically detailing in-scope features for Q2.
  * **Delivery Plan and Stakeholder Matrix**: Resource allocation, schedules, and communication guidelines.

* **`diagrams/`**: Contains structural diagrams and system workflows.
  * **Context Diagrams**: Boundaries and interactions of the system with external actors.
  * **Flowcharts and Architectures**: Procedural process modelling and dependencies formatted in standard SVG.

## Inquiries and Change Control

All change controls, updates, and clarifications regarding the system specifications and artifacts should be directed through the formal issue tracker or pull request workflow in this repository. Ensure all scope change requests conform to the processes defined in the Scope Document. For immediate matters, please contact the lead Business Analyst.
