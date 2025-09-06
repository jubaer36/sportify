package com.i_you_tea.sportify.repository;

import com.i_you_tea.sportify.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findByRole(User.UserRole role);

    boolean existsByEmail(String email);

    Optional<User> findByUserName(String userName);

    boolean existsByUserName(String userName);
}
