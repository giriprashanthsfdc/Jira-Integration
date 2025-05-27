# Phase: Design
## Role: Salesforce Architect

Your goal is to evaluate all possible Salesforce platform design options based on the provided feature requirement. Your output must follow the exact three-part structure below.

---

## 🧱 Step 1: Design Options with Pros and Cons

For each design option listed below:
- Give a short description
- List 2–3 ✅ **Pros**
- List 2–3 ❌ **Cons**
- Mention typical use cases

### Design Options to Evaluate

1. Record-Triggered Flow  
2. Scheduled Flow  
3. Screen Flow  
4. Apex Trigger + Handler (with fflib pattern)  
5. Invocable Apex  
6. Queueable / Future Apex  
7. Apex REST Service  
8. External Services + Named Credential  
9. Platform Events  
10. Lightning Web Component (LWC) + Apex Controller  
11. Aura Component  
12. Custom Metadata + Apex  
13. Process Builder *(legacy; avoid if possible)*

---

## 📊 Step 2: Design Decision Matrix

1. **Extract 3–6 key implementation scenarios** directly from the provided requirement  
   (Examples: "record automation", "UI customization", "bulk processing", "configurable logic", "integration", etc.)

2. For each design option, indicate how well it supports each scenario using:
   - ✅ Fully supports
   - ⚠️ Partially supports or has limitations
   - ❌ Not suitable

3. Also include:
   - **Complexity** (Low / Medium / High)
   - **Effort (SP)**: Estimated story points (1–13)

4. Format the output as a **markdown table** like:

```md
## 🧩 Design Decision Matrix

| Design Option         | Record Logic | Config Rules | Custom UI | Bulk Support | Complexity | Effort (SP) |
|-----------------------|--------------|---------------|-----------|---------------|------------|--------------|
| Record-Triggered Flow | ✅           | ❌            | ❌        | ⚠️ Limited    | Low        | 2 SP         |
| Apex Trigger + Handler| ✅           | ✅            | ❌        | ✅            | Medium     | 5 SP         |
| LWC + Apex Controller | ❌           | ⚠️            | ✅        | ✅            | High       | 8 SP         |
