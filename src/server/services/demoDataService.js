'use strict';

const { db } = require('../config/database');

const demoDataService = {
  async load(userId) {
    const existing = await db('companies').where({ name: 'Acme Corporation' }).first();
    if (existing) {
      return { alreadyLoaded: true };
    }

    return db.transaction(async (trx) => {
      // Tags
      const [hotLead, vip, followUp, strategic] = await trx('tags')
        .insert([
          { name: 'Hot Lead', color: '#ef4444' },
          { name: 'VIP', color: '#f59e0b' },
          { name: 'Follow-up', color: '#3b82f6' },
          { name: 'Strategic', color: '#8b5cf6' },
        ])
        .returning('*');

      // Companies
      const [acme, sunrise, bluesky] = await trx('companies')
        .insert([
          { name: 'Acme Corporation', industry: 'Technology', size: 'large', email: 'contact@acme.example.com', website: 'https://acme.example.com', city: 'San Francisco', country: 'USA', created_by: userId },
          { name: 'Sunrise Ventures', industry: 'Consulting', size: 'small', email: 'hello@sunrise.example.com', website: 'https://sunrise.example.com', city: 'New York', country: 'USA', created_by: userId },
          { name: 'Blue Sky Trading', industry: 'Retail', size: 'medium', email: 'info@bluesky.example.com', website: 'https://bluesky.example.com', city: 'Chicago', country: 'USA', created_by: userId },
        ])
        .returning('*');

      // Contacts
      const [john, sarah, michael, emma] = await trx('contacts')
        .insert([
          { first_name: 'John', last_name: 'Smith', email: 'john.smith@acme.example.com', position: 'CEO', company_id: acme.id, created_by: userId },
          { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@acme.example.com', position: 'Sales Manager', company_id: acme.id, created_by: userId },
          { first_name: 'Michael', last_name: 'Chen', email: 'michael.chen@sunrise.example.com', position: 'Partner', company_id: sunrise.id, created_by: userId },
          { first_name: 'Emma', last_name: 'Wilson', email: 'emma.wilson@bluesky.example.com', position: 'Procurement Manager', company_id: bluesky.id, created_by: userId },
        ])
        .returning('*');

      await trx('contact_phones').insert([
        { contact_id: john.id, phone_number: '+1-555-0101', label: 'work', is_primary: true },
        { contact_id: sarah.id, phone_number: '+1-555-0102', label: 'mobile', is_primary: true },
        { contact_id: michael.id, phone_number: '+1-555-0201', label: 'work', is_primary: true },
        { contact_id: emma.id, phone_number: '+1-555-0301', label: 'work', is_primary: true },
      ]);

      // Groups
      const [salesTeam, management] = await trx('groups')
        .insert([
          { name: 'Sales Team', description: 'Sales department members' },
          { name: 'Management', description: 'Management team' },
        ])
        .returning('*');

      await trx('group_members').insert([
        { group_id: salesTeam.id, user_id: userId },
        { group_id: management.id, user_id: userId },
      ]);

      // Projects
      const [erpProject, mobileApp, supplyChain] = await trx('projects')
        .insert([
          { name: 'ERP System Rollout', description: 'Full ERP implementation for Acme Corporation including data migration and training.', status: 'active', start_date: '2024-01-15', end_date: '2024-12-31', budget: 250000, company_id: acme.id, progress: 45, visibility: 'public', created_by: userId },
          { name: 'Mobile App Development', description: 'Customer-facing mobile application for Sunrise Ventures.', status: 'planning', start_date: '2024-03-01', end_date: '2024-09-30', budget: 80000, company_id: sunrise.id, progress: 0, visibility: 'restricted', created_by: userId },
          { name: 'Supply Chain Optimization', description: 'Process improvement and automation for Blue Sky Trading supply chain.', status: 'completed', start_date: '2023-06-01', end_date: '2024-02-28', budget: 120000, company_id: bluesky.id, progress: 100, visibility: 'public', created_by: userId },
        ])
        .returning('*');

      await trx('project_groups').insert({ project_id: mobileApp.id, group_id: salesTeam.id });

      // Leads
      const [cloudLead, crmLead, ecommerceLead, supportLead] = await trx('leads')
        .insert([
          { title: 'Cloud Infrastructure Migration', value: 180000, probability: 70, stage: 'negotiation', source: 'referral', status: 'open', company_id: acme.id, contact_id: john.id, visibility: 'public', created_by: userId },
          { title: 'CRM Implementation Project', value: 45000, probability: 90, stage: 'won', source: 'inbound', status: 'won', company_id: sunrise.id, contact_id: michael.id, visibility: 'public', created_by: userId },
          { title: 'E-commerce Platform Upgrade', value: 95000, probability: 50, stage: 'proposal', source: 'cold_call', status: 'open', company_id: bluesky.id, contact_id: emma.id, visibility: 'public', created_by: userId },
          { title: 'Annual Support Contract Renewal', value: 30000, probability: 85, stage: 'negotiation', source: 'existing_customer', status: 'open', company_id: acme.id, contact_id: sarah.id, visibility: 'restricted', created_by: userId },
        ])
        .returning('*');

      await trx('lead_groups').insert({ lead_id: supportLead.id, group_id: salesTeam.id });

      // Notes
      await trx('notes').insert([
        { content: 'Kick-off meeting completed. All stakeholders aligned on timeline and deliverables.', entity_type: 'project', entity_id: erpProject.id, created_by: userId },
        { content: 'Phase 1 data migration finished ahead of schedule. Moving to Phase 2 — system configuration.', entity_type: 'project', entity_id: erpProject.id, created_by: userId },
        { content: 'Initial discovery call with John Smith. Strong interest in cloud-first strategy.', entity_type: 'lead', entity_id: cloudLead.id, created_by: userId },
        { content: 'Sent proposal document. Emma requested 2-week review period.', entity_type: 'lead', entity_id: ecommerceLead.id, created_by: userId },
        { content: 'Key decision maker at Acme. Prefers communication via email. Best time to call: mornings.', entity_type: 'contact', entity_id: john.id, created_by: userId },
      ]);

      // Calendar events
      const now = new Date();
      const addDays = (days) => {
        const d = new Date(now);
        d.setDate(d.getDate() + days);
        return d;
      };

      const event1Start = addDays(2); event1Start.setHours(10, 0, 0, 0);
      const event1End = addDays(2); event1End.setHours(11, 30, 0, 0);
      const event2Start = addDays(3); event2Start.setHours(14, 0, 0, 0);
      const event2End = addDays(3); event2End.setHours(14, 30, 0, 0);
      const event3Start = addDays(7); event3Start.setHours(9, 0, 0, 0);
      const event3End = addDays(7); event3End.setHours(10, 0, 0, 0);

      await trx('calendar_events').insert([
        { title: 'ERP Project Kick-off', type: 'meeting', start_datetime: event1Start, end_datetime: event1End, description: 'Kick-off meeting with Acme team', user_id: userId },
        { title: 'Discovery Call — Blue Sky', type: 'call', start_datetime: event2Start, end_datetime: event2End, description: 'Exploratory call about e-commerce needs', user_id: userId },
        { title: 'Proposal Review — Sunrise', type: 'meeting', start_datetime: event3Start, end_datetime: event3End, description: 'Review CRM proposal with Michael Chen', user_id: userId },
      ]);

      // Entity tags
      await trx('entity_tags').insert([
        { entity_type: 'company', entity_id: acme.id, tag_id: vip.id },
        { entity_type: 'contact', entity_id: john.id, tag_id: vip.id },
        { entity_type: 'lead', entity_id: cloudLead.id, tag_id: hotLead.id },
        { entity_type: 'lead', entity_id: cloudLead.id, tag_id: strategic.id },
        { entity_type: 'lead', entity_id: crmLead.id, tag_id: strategic.id },
        { entity_type: 'project', entity_id: erpProject.id, tag_id: vip.id },
      ]);

      return {
        loaded: true,
        counts: {
          companies: 3,
          contacts: 4,
          groups: 2,
          tags: 4,
          projects: 3,
          leads: 4,
          notes: 5,
          events: 3,
        },
      };
    });
  },
};

module.exports = demoDataService;
