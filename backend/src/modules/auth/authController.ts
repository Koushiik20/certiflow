import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db';
import { config } from '../../config';
import { recordAuditLog } from '../audit/auditService';

export const DEMO_USERS = [
  {
    name: 'Anika',
    email: 'anika@skilling.gov.in',
    role: 'TRAINING_CENTRE',
    title: 'Training Centre Lead',
    trainingCentreCode: 'TC-NORTH-01',
    description: 'Uploads spreadsheets, manages candidate batches, and addresses correction requests.'
  },
  {
    name: 'Dev',
    email: 'dev@district.gov.in',
    role: 'DISTRICT_OFFICER',
    title: 'District Officer (North)',
    districtCode: 'DIST-NORTH',
    description: 'Reviews candidate data and performs primary district approval.'
  },
  {
    name: 'Meera',
    email: 'meera@district.gov.in',
    role: 'DISTRICT_OFFICER',
    title: 'District Officer (North - Senior)',
    districtCode: 'DIST-NORTH',
    description: 'Provides the mandatory distinct second district officer approval.'
  },
  {
    name: 'Kabir',
    email: 'kabir@district.gov.in',
    role: 'DISTRICT_OFFICER',
    title: 'District Officer (Central)',
    districtCode: 'DIST-CENTRAL',
    description: 'District officer for central skilling batches.'
  },
  {
    name: 'Neha',
    email: 'neha@quality.gov.in',
    role: 'QUALITY_TEAM',
    title: 'Quality Assurance Lead',
    description: 'Audits large batches (> 50 candidates) and flags anomalous student records.'
  },
  {
    name: 'Farah',
    email: 'farah@state.gov.in',
    role: 'STATE_OFFICE',
    title: 'State Directorate Officer',
    description: 'Provides final state authorization, initiates issuance, and revokes certificates.'
  }
];

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      district: true,
      trainingCentre: true
    }
  });

  if (!user) {
    res.status(401).json({ error: 'Invalid email or credentials.' });
    return;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({ error: 'Invalid email or credentials.' });
    return;
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    districtId: user.districtId,
    trainingCentreId: user.trainingCentreId,
  };

  const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '7d' });

  await recordAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'USER_LOGIN',
    entityType: 'AUTH',
    entityId: user.id,
    ipAddress: req.ip
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      district: user.district,
      trainingCentre: user.trainingCentre
    }
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      district: true,
      trainingCentre: true
    }
  });

  if (!user) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      district: user.district,
      trainingCentre: user.trainingCentre
    }
  });
}

export async function getDemoUsers(_req: Request, res: Response): Promise<void> {
  const usersInDb = await prisma.user.findMany({
    where: {
      email: { in: DEMO_USERS.map((u) => u.email) }
    },
    include: {
      district: true,
      trainingCentre: true
    }
  });

  const enrichedDemoUsers = DEMO_USERS.map((demo) => {
    const found = usersInDb.find((u) => u.email === demo.email);
    return {
      ...demo,
      id: found?.id,
      district: found?.district,
      trainingCentre: found?.trainingCentre,
    };
  });

  res.json({ demoUsers: enrichedDemoUsers });
}

export async function demoSwitch(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Demo user email is required.' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      district: true,
      trainingCentre: true
    }
  });

  if (!user) {
    res.status(404).json({ error: `Demo user with email '${email}' not found.` });
    return;
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    districtId: user.districtId,
    trainingCentreId: user.trainingCentreId,
  };

  const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '7d' });

  await recordAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'DEMO_USER_SWITCH',
    entityType: 'AUTH',
    entityId: user.id,
    metadata: { switchedTo: user.name, role: user.role }
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      district: user.district,
      trainingCentre: user.trainingCentre
    }
  });
}

