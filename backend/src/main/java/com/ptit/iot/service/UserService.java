package com.ptit.iot.service;

import com.ptit.iot.dto.ProfileDTO;
import com.ptit.iot.entity.User;
import com.ptit.iot.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> authenticate(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            return userOpt;
        }
        return Optional.empty();
    }

    public Optional<ProfileDTO> getProfile(String username) {
        return userRepository.findByUsername(username).map(this::toDTO);
    }

    public ProfileDTO updateProfile(String username, ProfileDTO dto) {
        User user = userRepository.findByUsername(username)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setUsername(username);
                    newUser.setPassword("123456");
                    return newUser;
                });

        if (dto.getName() != null) user.setName(dto.getName());
        if (dto.getImage() != null) user.setImage(dto.getImage());
        if (dto.getGithub() != null) user.setGithub(dto.getGithub());
        if (dto.getFigma() != null) user.setFigma(dto.getFigma());
        if (dto.getMsv() != null) user.setMsv(dto.getMsv());
        if (dto.getPostman() != null) user.setPostman(dto.getPostman());
        if (dto.getPdf() != null) user.setPdf(dto.getPdf());

        User saved = userRepository.save(user);
        ProfileDTO res = toDTO(saved);
        return res;
    }

    private ProfileDTO toDTO(User u) {
        ProfileDTO dto = new ProfileDTO();
        dto.setId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setName(u.getName());
        dto.setImage(u.getImage());
        dto.setGithub(u.getGithub());
        dto.setFigma(u.getFigma());
        dto.setMsv(u.getMsv());
        dto.setPostman(u.getPostman() != null ? u.getPostman() : "https://web.postman.co/");
        dto.setPdf(u.getPdf() != null ? u.getPdf() : "/bao-cao-iot.pdf");
        return dto;
    }
}

