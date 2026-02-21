'use strict';

const { db } = require('../config/database');
const { success } = require('../utils/response');

const MIN_SEARCH_LENGTH = 2;

function hasAdminRole(user) {
  return user.roles && user.roles.some(r =>
    ['admin', 'manager'].includes((r.name || r).toLowerCase()),
  );
}

const searchController = {
  async globalSearch(req, res, next) {
    try {
      const { q } = req.query;
      if (!q || q.trim().length < MIN_SEARCH_LENGTH) {
        return success(res, { projects: [], leads: [], contacts: [], companies: [] });
      }
      const term = `%${q.trim()}%`;
      const isAdmin = hasAdminRole(req.user);
      let userGroups = [];
      if (!isAdmin) {
        userGroups = await db('group_members').where({ user_id: req.user.id }).pluck('group_id');
      }

      let projectsQuery = db('projects')
        .whereNull('projects.deleted_at')
        .where(b => b.whereILike('projects.name', term).orWhereILike('projects.description', term))
        .select('projects.id', 'projects.name', 'projects.status')
        .limit(10);
      if (!isAdmin) {
        projectsQuery = projectsQuery.where(b => {
          b.where('projects.visibility', 'public');
          if (userGroups.length > 0) {
            b.orWhereIn('projects.id', db('project_groups').whereIn('group_id', userGroups).select('project_id'));
          }
          b.orWhere('projects.created_by', req.user.id);
        });
      }

      let leadsQuery = db('leads')
        .whereNull('leads.deleted_at')
        .where(b => b.whereILike('leads.title', term).orWhereILike('leads.source', term))
        .select('leads.id', 'leads.title', 'leads.status', 'leads.stage')
        .limit(10);
      if (!isAdmin) {
        leadsQuery = leadsQuery.where(b => {
          b.where('leads.visibility', 'public');
          if (userGroups.length > 0) {
            b.orWhereIn('leads.id', db('lead_groups').whereIn('group_id', userGroups).select('lead_id'));
          }
          b.orWhere('leads.created_by', req.user.id);
        });
      }

      const contactsQuery = db('contacts')
        .whereNull('contacts.deleted_at')
        .where(b =>
          b.whereILike('contacts.first_name', term)
            .orWhereILike('contacts.last_name', term)
            .orWhereILike('contacts.email', term),
        )
        .select('contacts.id', 'contacts.first_name', 'contacts.last_name', 'contacts.email')
        .limit(10);

      const companiesQuery = db('companies')
        .whereNull('companies.deleted_at')
        .whereILike('companies.name', term)
        .select('companies.id', 'companies.name', 'companies.industry')
        .limit(10);

      const [projects, leads, contacts, companies] = await Promise.all([
        projectsQuery,
        leadsQuery,
        contactsQuery,
        companiesQuery,
      ]);

      return success(res, { projects, leads, contacts, companies });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = searchController;
