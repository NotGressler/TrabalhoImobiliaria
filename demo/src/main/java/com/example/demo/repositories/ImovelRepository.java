package com.example.demo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import com.example.demo.models.ImovelModel;

public interface  ImovelRepository extends JpaRepository<ImovelModel, Integer>{
    @Query(value = "SELECT * FROM imoveis WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<ImovelModel> findByIdForUpdate(@Param("id") Integer id);
    
}
