#!/usr/bin/env node

/**
 * Script to manage SmartLabel AI users
 *
 * Usage:
 * node scripts/manage-users.js create <username> <email> <password> [role]
 * node scripts/manage-users.js list
 * node scripts/manage-users.js delete <username>
 * node scripts/manage-users.js update <username> <field> <value>
 *
 * Examples:
 * node scripts/manage-users.js create admin admin@smartlabel.ai admin123 admin
 * node scripts/manage-users.js create user1 user1@example.com password123 user
 * node scripts/manage-users.js list
 * node scripts/manage-users.js delete user1
 * node scripts/manage-users.js update admin role superadmin
 */

const { DynamoDB } = require('aws-sdk');

// DynamoDB configuration
const dynamodb = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const USERS_TABLE = process.env.USERS_TABLE || 'SmartLabel-Users-dev';

async function createUser(username, email, password, role = 'user') {
  try {
    // Check if user already exists
    const existingUser = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { username }
    }).promise();

    if (existingUser.Item) {
      console.log(`❌ User '${username}' already exists!`);
      return;
    }

    // Check if email already exists
    const emailResult = await dynamodb.query({
      TableName: USERS_TABLE,
      IndexName: 'by-email',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }).promise();

    if (emailResult.Items && emailResult.Items.length > 0) {
      console.log(`❌ Email '${email}' is already in use!`);
      return;
    }

    // Create user
    const user = {
      username,
      email,
      password, // In production, hash the password
      role,
      createdAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: USERS_TABLE,
      Item: user
    }).promise();

    console.log(`✅ User '${username}' created successfully!`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${role}`);
    console.log(`   Created at: ${user.createdAt}`);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  }
}

async function listUsers() {
  try {
    const result = await dynamodb.scan({
      TableName: USERS_TABLE,
      ProjectionExpression: 'username, email, role, createdAt, lastLogin'
    }).promise();

    if (!result.Items || result.Items.length === 0) {
      console.log('📝 No users found.');
      return;
    }

    console.log(`📝 User list (${result.Items.length} total):`);
    console.log('─'.repeat(80));

    result.Items.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      if (user.lastLogin) {
        console.log(`   Last login: ${user.lastLogin}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
}

async function deleteUser(username) {
  try {
    // Check if user exists
    const existingUser = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { username }
    }).promise();

    if (!existingUser.Item) {
      console.log(`❌ User '${username}' not found!`);
      return;
    }

    await dynamodb.delete({
      TableName: USERS_TABLE,
      Key: { username }
    }).promise();

    console.log(`✅ User '${username}' deleted successfully!`);
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
  }
}

async function updateUser(username, field, value) {
  try {
    // Check if user exists
    const existingUser = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { username }
    }).promise();

    if (!existingUser.Item) {
      console.log(`❌ User '${username}' not found!`);
      return;
    }

    // Validate field
    const allowedFields = ['email', 'password', 'role'];
    if (!allowedFields.includes(field)) {
      console.log(`❌ Field '${field}' is not valid. Allowed fields: ${allowedFields.join(', ')}`);
      return;
    }

    await dynamodb.update({
      TableName: USERS_TABLE,
      Key: { username },
      UpdateExpression: `SET ${field} = :value`,
      ExpressionAttributeValues: {
        ':value': value
      }
    }).promise();

    console.log(`✅ User '${username}' updated successfully!`);
    console.log(`   ${field}: ${value}`);
  } catch (error) {
    console.error('❌ Error updating user:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
🔐 SmartLabel AI - User Manager

Usage:
  node scripts/manage-users.js <command> [arguments]

Commands:
  create <username> <email> <password> [role]  - Create new user
  list                                        - List all users
  delete <username>                           - Delete user
  update <username> <field> <value>           - Update user

Examples:
  node scripts/manage-users.js create admin admin@smartlabel.ai admin123 admin
  node scripts/manage-users.js create user1 user1@example.com password123 user
  node scripts/manage-users.js list
  node scripts/manage-users.js delete user1
  node scripts/manage-users.js update admin role superadmin

Environment variables:
  AWS_REGION     - AWS region (default: us-east-1)
  USERS_TABLE    - DynamoDB table name (default: SmartLabel-Users-dev)
    `);
    return;
  }

  switch (command) {
    case 'create':
      if (args.length < 4) {
        console.log('❌ Usage: create <username> <email> <password> [role]');
        return;
      }
      await createUser(args[1], args[2], args[3], args[4] || 'user');
      break;

    case 'list':
      await listUsers();
      break;

    case 'delete':
      if (args.length < 2) {
        console.log('❌ Usage: delete <username>');
        return;
      }
      await deleteUser(args[1]);
      break;

    case 'update':
      if (args.length < 4) {
        console.log('❌ Usage: update <username> <field> <value>');
        return;
      }
      await updateUser(args[1], args[2], args[3]);
      break;

    default:
      console.log(`❌ Command '${command}' not recognized.`);
      console.log('Available commands: create, list, delete, update');
  }
}

// Execute if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createUser,
  listUsers,
  deleteUser,
  updateUser
};