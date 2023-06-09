// Capa de infraestructura que usa la interfaz

import prisma from '../../../../prisma/client';
import nodemailer from 'nodemailer';

import { UserInterface } from '../../domain/interfaces/userInterface';
import { User } from '../../domain/user';

// Importamos la conexión a la db, aquí realizamos la lógica de negocio
export class SqliteUserRepository implements UserInterface {
	private usersMemoization: Map<number, User> = new Map();

	private getUserFromMemoization(id: number): User | null {
		const userFounded = this.usersMemoization.get(id);

		if (!userFounded) return null;

		return userFounded;
	}

	private setUserToMemoization(user: User): void {
		this.usersMemoization.set(user.id!, user);
	}

	async createUser(user: User): Promise<User> {
		const userCreated = await prisma.user.create({
			data: {
				name: user.name,
				email: user.email,
			},
		});

		return userCreated;
	}

	async sendEmail(email: string): Promise<boolean | void> {
		const hostname = 'smtp-relay.sendinblue.com';
		const username = 'flaviooria.dev@gmail.com';
		const password = 'BQDyaxAr5FZOd2R1';

		let transporter = nodemailer.createTransport({
			host: hostname,
			port: 587,
			secure: false,
			requireTLS: true,
			auth: {
				user: username,
				pass: password,
			},
			logger: true,
		});

		// send mail with defined transport object
		let info = await transporter.sendMail({
			from: '"Sender Name" <from@cloudmta.com>',
			to: email,
			subject: 'Hello from node',
			text: 'Hello world?',
			html: '<strong>Hello world?</strong>',
		});

		console.log('Message sent: %s', info.response);
	}

	async getUserId(id: number): Promise<User | null> {
		if (!id) {
			throw new Error('Id field not found');
		}

		const user = this.getUserFromMemoization(id);

		if (user) return user;
		else {
			const userFoundedFromDb = await prisma.user.findUnique({ where: { id } });

			if (!userFoundedFromDb) return null;

			this.setUserToMemoization(userFoundedFromDb);
			return userFoundedFromDb;
		}
	}
}
