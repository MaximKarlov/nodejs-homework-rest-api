const express = require('express');

const contactsController = require('../../controllers/contacts-controller');

const schema = require('../../schemas/contacts');

const { validateBody } = require('../../decorators');

const router = express.Router();

router.get('/', contactsController.getAllContacts);

router.get('/:contactId', contactsController.getContactsById);

router.post(
  '/',
  validateBody(schema.contactsSchema),
  contactsController.addContacts
);

router.put(
  '/:contactId',
  validateBody(schema.contactsSchema),
  contactsController.updateContacts
);

router.delete('/:contactId', contactsController.deleteContacts);

module.exports = router;
