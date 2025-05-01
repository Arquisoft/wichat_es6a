import { handleImageChange, handleDeleteImage, handleSaveUsername, handleSavePassword } from './editProfileWindow';
import axios from 'axios';

jest.mock('axios');

describe('Funciones de edición de perfil', () => {
  // Pruebas para handleImageChange
  describe('handleImageChange', () => {
    it('debería cargar la imagen correctamente', async () => {
      const mockSetProfilePic = jest.fn();
      const mockSetImage = jest.fn();
      const user_Id = '12345';
      const event = { target: { files: [new Blob()] } };

      axios.post.mockResolvedValue({}); // Simula una respuesta exitosa

      await handleImageChange(event, user_Id, mockSetProfilePic, mockSetImage);
    });
  });

  // Pruebas para handleDeleteImage
  describe('handleDeleteImage', () => {
    it('debería eliminar la imagen correctamente', async () => {
      const mockSetImage = jest.fn();
      const mockSetProfilePic = jest.fn();
      const user_Id = '12345';

      axios.delete.mockResolvedValue({}); // Simula una respuesta exitosa

      await handleDeleteImage(user_Id, mockSetImage, mockSetProfilePic);

      expect(mockSetImage).toHaveBeenCalledWith(null);
      expect(mockSetProfilePic).toHaveBeenCalledWith(null);
    });

  });

  // Pruebas para handleSaveUsername
  describe('handleSaveUsername', () => {
    it('debería guardar el nombre de usuario correctamente', async () => {
      const mockSetUsernameError = jest.fn();
      const mockSetPasswordSuccess = jest.fn();
      const user_Id = '12345';
      const newUsername = 'nuevo_usuario';

      axios.put.mockResolvedValue({}); // Simula una respuesta exitosa

      await handleSaveUsername(newUsername, mockSetUsernameError, mockSetPasswordSuccess, user_Id);

      expect(mockSetUsernameError).toHaveBeenCalledWith('');
      expect(mockSetPasswordSuccess).toHaveBeenCalledWith('Nombre de usuario actualizado con éxito.');
    });

    it('debería manejar error si el nombre de usuario está vacío', async () => {
      const mockSetUsernameError = jest.fn();
      const mockSetPasswordSuccess = jest.fn();
      const user_Id = '12345';
      const newUsername = '';

      await handleSaveUsername(newUsername, mockSetUsernameError, mockSetPasswordSuccess, user_Id);

      expect(mockSetUsernameError).toHaveBeenCalledWith('El nombre de usuario no puede estar vacío.');
    });

  });

  // Pruebas para handleSavePassword
  describe('handleSavePassword', () => {
    it('debería cambiar la contraseña correctamente', async () => {
      const mockSetPasswordError = jest.fn();
      const mockSetPasswordSuccess = jest.fn();
      const user_Id = '12345';
      const currentPassword = 'oldPassword123';
      const newPassword = 'newPassword123';
      const repeatPassword = 'newPassword123';

      axios.put.mockResolvedValue({}); // Simula una respuesta exitosa

      await handleSavePassword(currentPassword, newPassword, repeatPassword, mockSetPasswordError, mockSetPasswordSuccess, user_Id);

      expect(mockSetPasswordError).toHaveBeenCalledWith('');
      expect(mockSetPasswordSuccess).toHaveBeenCalledWith('Contraseña actualizada con éxito.');
    });

    it('debería manejar error si las nuevas contraseñas no coinciden', async () => {
      const mockSetPasswordError = jest.fn();
      const mockSetPasswordSuccess = jest.fn();
      const user_Id = '12345';
      const currentPassword = 'oldPassword123';
      const newPassword = 'newPassword123';
      const repeatPassword = 'differentPassword123';

      await handleSavePassword(currentPassword, newPassword, repeatPassword, mockSetPasswordError, mockSetPasswordSuccess, user_Id);

      expect(mockSetPasswordError).toHaveBeenCalledWith('Las nuevas contraseñas no coinciden.');
    });

    it('debería manejar error si la contraseña actual está vacía', async () => {
      const mockSetPasswordError = jest.fn();
      const mockSetPasswordSuccess = jest.fn();
      const user_Id = '12345';
      const currentPassword = '';
      const newPassword = 'newPassword123';
      const repeatPassword = 'newPassword123';

      await handleSavePassword(currentPassword, newPassword, repeatPassword, mockSetPasswordError, mockSetPasswordSuccess, user_Id);

      expect(mockSetPasswordError).toHaveBeenCalledWith('Por favor, ingresa tu contraseña actual.');
    });

  });
});
