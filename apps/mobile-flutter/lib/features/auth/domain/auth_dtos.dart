class LoginRequestDto {
  LoginRequestDto({required this.email, required this.password});

  final String email;
  final String password;

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
      };
}

class RegisterRequestDto {
  RegisterRequestDto({
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
    required this.username,
  });

  final String email;
  final String password;
  final String firstName;
  final String lastName;
  final String username;

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'username': username,
      };
}

class ForgotPasswordRequestDto {
  ForgotPasswordRequestDto({required this.email});
  final String email;
  Map<String, dynamic> toJson() => {'email': email};
}

class ResetPasswordRequestDto {
  ResetPasswordRequestDto({
    required this.token,
    required this.newPassword,
  });

  final String token;
  final String newPassword;

  Map<String, dynamic> toJson() => {
        'token': token,
        'newPassword': newPassword,
      };
}
